import os
import uuid
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client, ClientOptions

"""
app.py

Flask REST API for the Kanban task board.

All routes are protected by the require_auth decorator which verifies the
user's Supabase session token on every request. A new Supabase client is
created per request with the token attached so RLS policies are satisfied —
Supabase knows who is making the request and only returns that user's data.

Environment variables required:
  SUPABASE_URL      — your Supabase project URL
  SUPABASE_ANON_KEY — your Supabase public anon key

Endpoints:
  GET    /health
  GET    /tasks                        — list all tasks
  POST   /tasks                        — create a task
  PATCH  /tasks/<task_id>              — update a task
  DELETE /tasks/<task_id>              — delete a task
  GET    /tasks/<task_id>/comments     — list comments on a task
  POST   /tasks/<task_id>/comments     — add a comment
  GET    /tasks/<task_id>/activity     — list activity on a task
  GET    /team                         — list team members
  POST   /team                         — add a team member
  DELETE /team/<member_id>             — remove a team member
  GET    /labels                       — list labels
  POST   /labels                       — create a label
  DELETE /labels/<label_id>            — delete a label
"""

app = Flask(__name__)
CORS(app)

SUPABASE_URL      = os.environ["SUPABASE_URL"]
SUPABASE_ANON_KEY = os.environ["SUPABASE_ANON_KEY"]

# Used only for token verification — has no user context
auth_client: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


# ── Helpers ───────────────────────────────────────────────────────────────────

def get_db(token: str) -> Client:
    """
    Creates a Supabase client with the user's JWT attached via postgrest.auth().
    This satisfies RLS — Supabase identifies the user from the token and
    only allows access to rows where user_id matches auth.uid().
    A new client is created per request rather than reusing a global one.
    """
    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    client.postgrest.auth(token)
    return client


def get_auth():
    """
    Extracts and verifies the Bearer token from the Authorization header.
    Returns (user_id, token) on success, or (None, None) if invalid.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None, None
    token = auth_header.removeprefix("Bearer ")
    try:
        resp = auth_client.auth.get_user(token)
        user = resp.user
        return (user.id if user else None), token
    except Exception as e:
        print("Auth error:", e)
        return None, None


def require_auth(f):
    """
    Decorator that protects a route with authentication.
    Injects user_id and token as the first two arguments to the wrapped function.
    Returns 401 if the token is missing or invalid.
    """
    @wraps(f)
    def wrapper(*args, **kwargs):
        user_id, token = get_auth()
        if not user_id:
            return jsonify({"error": "Unauthorized"}), 401
        return f(user_id, token, *args, **kwargs)
    return wrapper


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    """Simple health check — used to confirm the server is running."""
    return jsonify({"status": "ok"})


# ── Tasks ─────────────────────────────────────────────────────────────────────

@app.get("/tasks")
@require_auth
def get_tasks(user_id, token):
    """Returns all tasks for the authenticated user, ordered newest first."""
    db  = get_db(token)
    res = db.table("tasks").select("*").order("created_at", desc=True).execute()
    return jsonify(res.data)


@app.post("/tasks")
@require_auth
def create_task(user_id, token):
    """
    Creates a new task and logs a 'created' activity entry.
    Requires: title (string)
    Optional: description, status, priority, due_date, assignees, label_ids
    """
    db   = get_db(token)
    body = request.get_json()
    if not body or not body.get("title"):
        return jsonify({"error": "title is required"}), 400

    task = {
        "id":          str(uuid.uuid4()),
        "user_id":     user_id,
        "title":       body["title"],
        "description": body.get("description", ""),
        "status":      body.get("status", "todo"),
        "priority":    body.get("priority", "normal"),
        "due_date":    body.get("due_date"),
        "assignees":   body.get("assignees", []),
        "label_ids":   body.get("label_ids", []),
    }

    res = db.table("tasks").insert(task).execute()

    # Log creation event in the activity table
    db.table("activity").insert({
        "id":      str(uuid.uuid4()),
        "task_id": task["id"],
        "user_id": user_id,
        "type":    "created",
        "text":    "Task created",
    }).execute()

    return jsonify(res.data[0]), 201


@app.patch("/tasks/<task_id>")
@require_auth
def update_task(user_id, token, task_id):
    """
    Updates any fields on an existing task.
    If the status field is changed, logs a 'moved' activity entry.
    Returns 404 if the task doesn't exist or doesn't belong to the user.
    """
    db   = get_db(token)
    body = request.get_json()
    if not body:
        return jsonify({"error": "request body required"}), 400

    res = db.table("tasks").update(body).eq("id", task_id).execute()
    if not res.data:
        return jsonify({"error": "task not found"}), 404

    # Log a status change as a 'moved' activity entry
    if "status" in body:
        db.table("activity").insert({
            "id":      str(uuid.uuid4()),
            "task_id": task_id,
            "user_id": user_id,
            "type":    "moved",
            "text":    f"Status changed to {body['status']}",
        }).execute()

    return jsonify(res.data[0])


@app.delete("/tasks/<task_id>")
@require_auth
def delete_task(user_id, token, task_id):
    """
    Deletes a task. Related comments and activity are cascade-deleted by the DB.
    Returns 404 if the task doesn't exist or doesn't belong to the user.
    """
    db  = get_db(token)
    res = db.table("tasks").delete().eq("id", task_id).execute()
    if not res.data:
        return jsonify({"error": "task not found"}), 404
    return "", 204


# ── Comments ──────────────────────────────────────────────────────────────────

@app.get("/tasks/<task_id>/comments")
@require_auth
def get_comments(user_id, token, task_id):
    """Returns all comments on a task, ordered oldest first."""
    db  = get_db(token)
    res = db.table("comments").select("*").eq("task_id", task_id).order("created_at").execute()
    return jsonify(res.data)


@app.post("/tasks/<task_id>/comments")
@require_auth
def create_comment(user_id, token, task_id):
    """
    Adds a comment to a task and logs a 'comment' activity entry.
    Requires: text (string)
    """
    db   = get_db(token)
    body = request.get_json()
    if not body or not body.get("text"):
        return jsonify({"error": "text is required"}), 400

    comment = {
        "id":      str(uuid.uuid4()),
        "task_id": task_id,
        "user_id": user_id,
        "text":    body["text"],
    }

    res = db.table("comments").insert(comment).execute()

    # Log comment event in the activity table
    db.table("activity").insert({
        "id":      str(uuid.uuid4()),
        "task_id": task_id,
        "user_id": user_id,
        "type":    "comment",
        "text":    "Comment added",
    }).execute()

    return jsonify(res.data[0]), 201


# ── Activity ──────────────────────────────────────────────────────────────────

@app.get("/tasks/<task_id>/activity")
@require_auth
def get_activity(user_id, token, task_id):
    """Returns all activity entries for a task, ordered newest first."""
    db  = get_db(token)
    res = db.table("activity").select("*").eq("task_id", task_id).order("created_at", desc=True).execute()
    return jsonify(res.data)


# ── Team ──────────────────────────────────────────────────────────────────────

@app.get("/team")
@require_auth
def get_team(user_id, token):
    """Returns all team members for the authenticated user."""
    db  = get_db(token)
    res = db.table("team_members").select("*").execute()
    return jsonify(res.data)


@app.post("/team")
@require_auth
def create_team_member(user_id, token):
    """
    Adds a new team member.
    Requires: name (string)
    Optional: color (hex string, defaults to #6366f1)
    """
    db   = get_db(token)
    body = request.get_json()
    if not body or not body.get("name"):
        return jsonify({"error": "name is required"}), 400

    member = {
        "id":      str(uuid.uuid4()),
        "user_id": user_id,
        "name":    body["name"],
        "color":   body.get("color", "#6366f1"),
    }

    res = db.table("team_members").insert(member).execute()
    return jsonify(res.data[0]), 201


@app.delete("/team/<member_id>")
@require_auth
def delete_team_member(user_id, token, member_id):
    """
    Removes a team member.
    Returns 404 if the member doesn't exist or doesn't belong to the user.
    """
    db  = get_db(token)
    res = db.table("team_members").delete().eq("id", member_id).execute()
    if not res.data:
        return jsonify({"error": "member not found"}), 404
    return "", 204


# ── Labels ────────────────────────────────────────────────────────────────────

@app.get("/labels")
@require_auth
def get_labels(user_id, token):
    """Returns all labels for the authenticated user."""
    db  = get_db(token)
    res = db.table("labels").select("*").execute()
    return jsonify(res.data)


@app.post("/labels")
@require_auth
def create_label(user_id, token):
    """
    Creates a new label.
    Requires: label (string)
    Optional: color (hex string, defaults to #6366f1)
    """
    db   = get_db(token)
    body = request.get_json()
    if not body or not body.get("label"):
        return jsonify({"error": "label is required"}), 400

    label = {
        "id":      str(uuid.uuid4()),
        "user_id": user_id,
        "label":   body["label"],
        "color":   body.get("color", "#6366f1"),
    }

    res = db.table("labels").insert(label).execute()
    return jsonify(res.data[0]), 201


@app.delete("/labels/<label_id>")
@require_auth
def delete_label(user_id, token, label_id):
    """
    Deletes a label.
    Returns 404 if the label doesn't exist or doesn't belong to the user.
    """
    db  = get_db(token)
    res = db.table("labels").delete().eq("id", label_id).execute()
    if not res.data:
        return jsonify({"error": "label not found"}), 404
    return "", 204


# ── Run ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    # PORT is set dynamically by Railway in production
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)