import json

path = r"c:\Users\kayle\OneDrive\Desktop\assignment2\TRESCSV.json"

with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)

stars = data.pop("stars")

with open(path, "w", encoding="utf-8", newline="\n") as f:
    f.write("{\n")
    for key, value in data.items():
        dumped = json.dumps(value, indent=2, ensure_ascii=False)
        indented = dumped.replace("\n", "\n  ")
        f.write(f"  {json.dumps(key)}: {indented},\n")
    f.write('  "stars": [\n')
    last = len(stars) - 1
    for i, star in enumerate(stars):
        comma = "," if i < last else ""
        line = json.dumps(star, ensure_ascii=False, separators=(", ", ": "))
        f.write(f"    {line}{comma}\n")
    f.write("  ]\n}\n")

with open(path, "r", encoding="utf-8") as f:
    line_count = sum(1 for _ in f)

print("lines:", line_count)
print("stars:", len(stars))
