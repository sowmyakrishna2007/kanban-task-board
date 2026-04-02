import os
import uuid
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client

app = Flask(__name__)
CORS(app)

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_ANON_KEY = os.environ["SUPABASE_ANON_KEY"]

# Base client (used only for auth)
base_supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


# ── Auth Helpers ──────────────────────────────────────────────────────────────

def get_auth():
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None, None

    token = auth.removeprefix("Bearer ")

    try:
        user = base_supabase.auth.get_user(token)
        return (user.user.id if user.user else None), token
    except Exception:
        return None, None


def require_auth(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        user_id, token = get_auth()
        if not user_id:
            return jsonify({"error": "Unauthorized"}), 401
        return f(user_id, token, *args, **kwargs)
    return wrapper


def get_supabase_client(token: str) -> Client:
    return create_client(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        options={
            "headers": {
                "Authorization": f"Bearer {token}"
            }
        }
    )


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return jsonify({"status": "ok"})


# ── Tasks ─────────────────────────────────────────────────────────────────────

@app.get("/tasks")
@require_auth
def get_tasks(user_id, token):
    sb = get_supabase_client(token)

    res = (
        sb.table("tasks")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    return jsonify(res.data)


@app.post("/tasks")
@require_auth
def create_task(user_id, token):
    sb = get_supabase_client(token)
    body = request.get_json()

    if not body or not body.get("title"):
        return jsonify({"error": "title is required"}), 400

    task = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,  # required for RLS insert policy
        "title": body["title"],
        "description": body.get("description", ""),
        "status": body.get("status", "todo"),
        "priority": body.get("priority", "normal"),
        "due_date": body.get("due_date"),
        "assignees": body.get("assignees", []),
        "label_ids": body.get("label_ids", []),
    }

    res = sb.table("tasks").insert(task).execute()

    sb.table("activity").insert({
        "id": str(uuid.uuid4()),
        "task_id": task["id"],
        "user_id": user_id,
        "type": "created",
        "text": "Task created",
    }).execute()

    return jsonify(res.data[0]), 201


@app.patch("/tasks/<task_id>")
@require_auth
def update_task(user_id, token, task_id):
    sb = get_supabase_client(token)
    body = request.get_json()

    if not body:
        return jsonify({"error": "request body required"}), 400

    res = (
        sb.table("tasks")
        .update(body)
        .eq("id", task_id)
        .execute()
    )

    if not res.data:
        return jsonify({"error": "task not found"}), 404

    if "status" in body:
        sb.table("activity").insert({
            "id": str(uuid.uuid4()),
            "task_id": task_id,
            "user_id": user_id,
            "type": "moved",
            "text": f"Status changed to {body['status']}",
        }).execute()

    return jsonify(res.data[0])


@app.delete("/tasks/<task_id>")
@require_auth
def delete_task(user_id, token, task_id):
    sb = get_supabase_client(token)

    res = (
        sb.table("tasks")
        .delete()
        .eq("id", task_id)
        .execute()
    )

    if not res.data:
        return jsonify({"error": "task not found"}), 404

    return "", 204


# ── Comments ──────────────────────────────────────────────────────────────────

@app.get("/tasks/<task_id>/comments")
@require_auth
def get_comments(user_id, token, task_id):
    sb = get_supabase_client(token)

    res = (
        sb.table("comments")
        .select("*")
        .eq("task_id", task_id)
        .order("created_at")
        .execute()
    )
    return jsonify(res.data)


@app.post("/tasks/<task_id>/comments")
@require_auth
def create_comment(user_id, token, task_id):
    sb = get_supabase_client(token)
    body = request.get_json()

    if not body or not body.get("text"):
        return jsonify({"error": "text is required"}), 400

    comment = {
        "id": str(uuid.uuid4()),
        "task_id": task_id,
        "user_id": user_id,
        "text": body["text"],
    }

    res = sb.table("comments").insert(comment).execute()

    sb.table("activity").insert({
        "id": str(uuid.uuid4()),
        "task_id": task_id,
        "user_id": user_id,
        "type": "comment",
        "text": "Comment added",
    }).execute()

    return jsonify(res.data[0]), 201


# ── Activity ──────────────────────────────────────────────────────────────────

@app.get("/tasks/<task_id>/activity")
@require_auth
def get_activity(user_id, token, task_id):
    sb = get_supabase_client(token)

    res = (
        sb.table("activity")
        .select("*")
        .eq("task_id", task_id)
        .order("created_at", desc=True)
        .execute()
    )
    return jsonify(res.data)


# ── Team ──────────────────────────────────────────────────────────────────────

@app.get("/team")
@require_auth
def get_team(user_id, token):
    sb = get_supabase_client(token)

    res = sb.table("team_members").select("*").execute()
    return jsonify(res.data)


@app.post("/team")
@require_auth
def create_team_member(user_id, token):
    sb = get_supabase_client(token)
    body = request.get_json()

    if not body or not body.get("name"):
        return jsonify({"error": "name is required"}), 400

    member = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "name": body["name"],
        "color": body.get("color", "#6366f1"),
    }

    res = sb.table("team_members").insert(member).execute()
    return jsonify(res.data[0]), 201


@app.delete("/team/<member_id>")
@require_auth
def delete_team_member(user_id, token, member_id):
    sb = get_supabase_client(token)

    res = (
        sb.table("team_members")
        .delete()
        .eq("id", member_id)
        .execute()
    )

    if not res.data:
        return jsonify({"error": "member not found"}), 404

    return "", 204


# ── Labels ────────────────────────────────────────────────────────────────────

@app.get("/labels")
@require_auth
def get_labels(user_id, token):
    sb = get_supabase_client(token)

    res = sb.table("labels").select("*").execute()
    return jsonify(res.data)


@app.post("/labels")
@require_auth
def create_label(user_id, token):
    sb = get_supabase_client(token)
    body = request.get_json()

    if not body or not body.get("label"):
        return jsonify({"error": "label is required"}), 400

    label = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "label": body["label"],
        "color": body.get("color", "#6366f1"),
    }

    res = sb.table("labels").insert(label).execute()
    return jsonify(res.data[0]), 201


@app.delete("/labels/<label_id>")
@require_auth
def delete_label(user_id, token, label_id):
    sb = get_supabase_client(token)

    res = (
        sb.table("labels")
        .delete()
        .eq("id", label_id)
        .execute()
    )

    if not res.data:
        return jsonify({"error": "label not found"}), 404

    return "", 204


# ── Run ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)