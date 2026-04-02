import os
import uuid
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client

app = Flask(__name__)
CORS(app, origins="*")
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_ANON_KEY = os.environ["SUPABASE_ANON_KEY"]

# Global Supabase client with anon key
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


# ── Auth Helpers ──────────────────────────────────────────────────────────────

def get_user_id():
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None

    token = auth.removeprefix("Bearer ")

    try:
        user = supabase.auth.get_user(token)
        return user.user.id if user.user else None
    except Exception:
        return None


def require_auth(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        user_id = get_user_id()
        if not user_id:
            return jsonify({"error": "Unauthorized"}), 401
        return f(user_id, *args, **kwargs)
    return wrapper


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return jsonify({"status": "ok"})


# ── Tasks ─────────────────────────────────────────────────────────────────────

@app.get("/tasks")
@require_auth
def get_tasks(user_id):
    res = supabase.table("tasks").select("*").order("created_at", desc=True).execute()
    return jsonify(res.data)


@app.post("/tasks")
@require_auth
def create_task(user_id):
    body = request.get_json()
    if not body or not body.get("title"):
        return jsonify({"error": "title is required"}), 400

    task = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": body["title"],
        "description": body.get("description", ""),
        "status": body.get("status", "todo"),
        "priority": body.get("priority", "normal"),
        "due_date": body.get("due_date"),
        "assignees": body.get("assignees", []),
        "label_ids": body.get("label_ids", []),
    }

    res = supabase.table("tasks").insert(task).execute()

    # Log activity
    supabase.table("activity").insert({
        "id": str(uuid.uuid4()),
        "task_id": task["id"],
        "user_id": user_id,
        "type": "created",
        "text": "Task created",
    }).execute()

    return jsonify(res.data[0]), 201


@app.patch("/tasks/<task_id>")
@require_auth
def update_task(user_id, task_id):
    body = request.get_json()
    if not body:
        return jsonify({"error": "request body required"}), 400

    res = supabase.table("tasks").update(body).eq("id", task_id).execute()
    if not res.data:
        return jsonify({"error": "task not found"}), 404

    if "status" in body:
        supabase.table("activity").insert({
            "id": str(uuid.uuid4()),
            "task_id": task_id,
            "user_id": user_id,
            "type": "moved",
            "text": f"Status changed to {body['status']}",
        }).execute()

    return jsonify(res.data[0])


@app.delete("/tasks/<task_id>")
@require_auth
def delete_task(user_id, task_id):
    res = supabase.table("tasks").delete().eq("id", task_id).execute()
    if not res.data:
        return jsonify({"error": "task not found"}), 404
    return "", 204


# ── Comments ──────────────────────────────────────────────────────────────────

@app.get("/tasks/<task_id>/comments")
@require_auth
def get_comments(user_id, task_id):
    res = supabase.table("comments").select("*").eq("task_id", task_id).order("created_at").execute()
    return jsonify(res.data)


@app.post("/tasks/<task_id>/comments")
@require_auth
def create_comment(user_id, task_id):
    body = request.get_json()
    if not body or not body.get("text"):
        return jsonify({"error": "text is required"}), 400

    comment = {
        "id": str(uuid.uuid4()),
        "task_id": task_id,
        "user_id": user_id,
        "text": body["text"],
    }

    res = supabase.table("comments").insert(comment).execute()

    supabase.table("activity").insert({
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
def get_activity(user_id, task_id):
    res = supabase.table("activity").select("*").eq("task_id", task_id).order("created_at", desc=True).execute()
    return jsonify(res.data)


# ── Team ──────────────────────────────────────────────────────────────────────

@app.get("/team")
@require_auth
def get_team(user_id):
    res = supabase.table("team_members").select("*").execute()
    return jsonify(res.data)


@app.post("/team")
@require_auth
def create_team_member(user_id):
    body = request.get_json()
    if not body or not body.get("name"):
        return jsonify({"error": "name is required"}), 400

    member = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "name": body["name"],
        "color": body.get("color", "#6366f1"),
    }

    res = supabase.table("team_members").insert(member).execute()
    return jsonify(res.data[0]), 201


@app.delete("/team/<member_id>")
@require_auth
def delete_team_member(user_id, member_id):
    res = supabase.table("team_members").delete().eq("id", member_id).execute()
    if not res.data:
        return jsonify({"error": "member not found"}), 404
    return "", 204


# ── Labels ────────────────────────────────────────────────────────────────────

@app.get("/labels")
@require_auth
def get_labels(user_id):
    res = supabase.table("labels").select("*").execute()
    return jsonify(res.data)


@app.post("/labels")
@require_auth
def create_label(user_id):
    body = request.get_json()
    if not body or not body.get("label"):
        return jsonify({"error": "label is required"}), 400

    label = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "label": body["label"],
        "color": body.get("color", "#6366f1"),
    }

    res = supabase.table("labels").insert(label).execute()
    return jsonify(res.data[0]), 201


@app.delete("/labels/<label_id>")
@require_auth
def delete_label(user_id, label_id):
    res = supabase.table("labels").delete().eq("id", label_id).execute()
    if not res.data:
        return jsonify({"error": "label not found"}), 404
    return "", 204


# ── Run ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)