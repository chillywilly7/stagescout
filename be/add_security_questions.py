import json

with open('data/taskers.json', 'r') as f:
    data = json.load(f)

# Security questions for each tasker
security_questions = [
    {"q1": "What is your pet's name?", "a1": "buddy", "q2": "What city were you born in?", "a2": "austin"},
    {"q1": "What was your first car?", "a1": "honda", "q2": "What is your favorite movie?", "a2": "inception"},
    {"q1": "What is your mother's maiden name?", "a1": "smith", "q2": "What was your first job?", "a2": "barista"},
    {"q1": "What is your favorite food?", "a1": "pizza", "q2": "What street did you grow up on?", "a2": "main street"},
    {"q1": "What is your favorite color?", "a1": "blue", "q2": "What was your first pet's name?", "a2": "max"},
    {"q1": "What year were you born?", "a1": "1990", "q2": "What is your favorite band?", "a2": "the beatles"},
    {"q1": "What is your favorite sport?", "a1": "basketball", "q2": "What was your high school name?", "a2": "central high"},
    {"q1": "What is your favorite book?", "a1": "1984", "q2": "What is your favorite restaurant?", "a2": "olive garden"},
    {"q1": "What is your favorite animal?", "a1": "dog", "q2": "What was your first phone?", "a2": "iphone"},
    {"q1": "What is your lucky number?", "a1": "7", "q2": "What is your favorite holiday?", "a2": "christmas"},
    {"q1": "What was your first school?", "a1": "elementary", "q2": "What is your favorite drink?", "a2": "coffee"},
    {"q1": "What is your favorite song?", "a1": "bohemian rhapsody", "q2": "What city do you live in?", "a2": "austin"},
    {"q1": "What is your favorite actor?", "a1": "tom hanks", "q2": "What is your dream job?", "a2": "musician"},
    {"q1": "What is your favorite season?", "a1": "summer", "q2": "What was your childhood nickname?", "a2": "ace"},
]

for i, tasker in enumerate(data['taskers']):
    if i < len(security_questions):
        sq = security_questions[i]
        tasker['security_question_1'] = sq['q1']
        tasker['security_answer_1'] = sq['a1']
        tasker['security_question_2'] = sq['q2']
        tasker['security_answer_2'] = sq['a2']

with open('data/taskers.json', 'w') as f:
    json.dump(data, f, indent=2)

print("✓ Added security questions to all taskers")
