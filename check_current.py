import sys, base64, re
sys.stdout.reconfigure(encoding='utf-8')

# Read fixed file and write to project
with open(r'C:\Users\احمد\Documents\projects\yalanelab-main\src\components\domino\DominoBoardOnline2D.tsx', 'r', encoding='utf-8') as f:
    current = f.read()

print(f"Current lines: {current.count(chr(10))}")
