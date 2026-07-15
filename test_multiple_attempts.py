import requests
import json

base_url = "http://localhost:5000/api"

# 1. Login as student
login_res = requests.post(f"{base_url}/auth/login", json={"email": "student@example.com", "password": "password"})
if "data" not in login_res.json():
    print("Login failed:", login_res.text)
    exit()
token = login_res.json()["data"]["token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Get available exams
exams_res = requests.get(f"{base_url}/student/exams", headers=headers)
exams = exams_res.json()["data"]["exams"]

if not exams:
    print("No available exams found.")
    exit()

exam_id = exams[0]["id"]
print(f"Testing with exam: {exam_id}")

# 3. Start exam (First attempt)
start_res1 = requests.post(f"{base_url}/student/exams/{exam_id}/start", headers=headers)
print("Start 1 Status:", start_res1.status_code)
print("Start 1 Response:", start_res1.text)

if start_res1.status_code != 201:
    print("Failed to start")
    exit()

attempt_id = start_res1.json()["data"]["attempt"]["id"]
print("Attempt ID:", attempt_id)

# 4. Submit exam
submit_res = requests.post(f"{base_url}/student/attempts/{attempt_id}/submit", json={"tabSwitchCount": 0}, headers=headers)
print("Submit Status:", submit_res.status_code)
print("Submit Response:", submit_res.text)

# 5. Try to start exam again
start_res2 = requests.post(f"{base_url}/student/exams/{exam_id}/start", headers=headers)
print("Start 2 Status:", start_res2.status_code)
print("Start 2 Response:", start_res2.text)
