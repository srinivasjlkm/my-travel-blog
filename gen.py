import json, re
from pathlib import Path
from jinja2 import Environment, FileSystemLoader

root = Path(__file__).parent
data = json.loads((root / "data.json").read_text())["countries"]

# compute a short label for the route strip
for c in data:
    for p in c["places"]:
        short = re.split(r"[(&]", p["name"])[0].strip()
        p["short"] = short

env = Environment(loader=FileSystemLoader(str(root / "templates")))
tmpl = env.get_template("country.html.j2")

out_dir = root / "countries"
out_dir.mkdir(exist_ok=True)

for i, country in enumerate(data):
    prev_c = data[i - 1] if i > 0 else None
    next_c = data[i + 1] if i < len(data) - 1 else None
    fallback_count = sum(p.get("gallery", 0) for p in country["places"]) or 6
    html = tmpl.render(country=country, prev_country=prev_c, next_country=next_c, fallback_count=fallback_count)
    (out_dir / f"{country['slug']}.html").write_text(html)
    print("wrote", country["slug"])

print("done —", len(data), "country pages generated")
