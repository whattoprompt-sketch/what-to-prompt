import re

with open('backend/core/alchemy_engine.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the indentation on line 913
content = content.replace('\nif has_contradiction:', '\n             if has_contradiction:')

with open('backend/core/alchemy_engine.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed indentation")
