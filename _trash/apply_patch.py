import sys, subprocess
sys.stdout.reconfigure(encoding='utf-8')

patch_path = r'C:\Users\احمد\Documents\projects\yalanelab-main\domino_snake.patch'
target = r'C:\Users\احمد\Documents\projects\yalanelab-main\src\components\domino\DominoBoardOnline2D.tsx'

# apply patch using python directly (manual patching)
with open(patch_path, 'r', encoding='utf-8') as f:
    patch = f.read()

with open(target, 'r', encoding='utf-8') as f:
    original = f.read()

# manual apply: parse unified diff
import re

# find the hunks
lines = patch.split('\n')
orig_lines = original.split('\n')
result_lines = orig_lines[:]

offset = 0
i = 0
applied = 0
while i < len(lines):
    hunk_match = re.match(r'^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@', lines[i])
    if hunk_match:
        orig_start = int(hunk_match.group(1)) - 1  # 0-indexed
        i += 1
        rem = []
        add = []
        while i < len(lines) and not lines[i].startswith('@@') and not lines[i].startswith('---') and not lines[i].startswith('+++'):
            if lines[i].startswith('-'):
                rem.append(lines[i][1:])
            elif lines[i].startswith('+'):
                add.append(lines[i][1:])
            elif lines[i].startswith(' '):
                rem.append(lines[i][1:])
                add.append(lines[i][1:])
            i += 1
        
        # find position in result
        pos = orig_start + offset
        result_lines[pos:pos+len([x for x in rem if x in orig_lines[orig_start:orig_start+len(rem)+2]])] 
        
        # simple replacement
        orig_block = [l for l in rem if not l.startswith('+')]
        new_block = add
        
        # find orig_block in result_lines around pos
        for search_pos in range(max(0, pos-2), min(len(result_lines), pos+5)):
            if result_lines[search_pos:search_pos+len(orig_block)] == orig_block:
                result_lines[search_pos:search_pos+len(orig_block)] = new_block
                offset += len(new_block) - len(orig_block)
                applied += 1
                break
    else:
        i += 1

result = '\n'.join(result_lines)
with open(target, 'w', encoding='utf-8') as f:
    f.write(result)

print(f"Applied {applied} hunks")
print(f"Result lines: {len(result_lines)}")
