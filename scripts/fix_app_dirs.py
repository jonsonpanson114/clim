import os
import shutil
from pathlib import Path

base_dir = Path(r"c:\Users\jonso\.gemini\clim\src\app")

def clean_up():
    print(f"Cleaning up {base_dir}...")
    
    # 1. Identify all files we want to keep, mapped to their target paths
    # We'll look for anything that looks like a page or route
    file_map = {}
    
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            p = Path(root) / file
            rel = p.relative_to(base_dir)
            
            # Normalize the path by removing trailing slashes/parens/brackets from directory names
            parts = []
            for part in rel.parts:
                normalized = part.strip().replace(" ", "")
                # Specific fixes for the messes we saw
                if normalized in ["(app", "(app/", "(app\\", "(app)", "(app/)", "(app\\)"]:
                    normalized = "(app)"
                elif normalized in ["[id", "[id/", "[id\\", "[id]", "[id\\]", "[id\\]"]:
                    normalized = "[id]"
                
                parts.append(normalized)
            
            target_rel = Path(*parts)
            
            # If it's the root page.tsx, we might want to skip it if it's the starter
            if target_rel == Path("page.tsx"):
                with open(p, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    if "To get started, edit the page.tsx file." in content:
                        print(f"Skipping starter page: {p}")
                        continue
            
            if target_rel not in file_map or p.stat().st_mtime > file_map[target_rel]['mtime']:
                file_map[target_rel] = {'path': p, 'mtime': p.stat().st_mtime}

    # 2. Move to a temp directory
    temp_dir = Path(r"c:\Users\jonso\.gemini\clim\temp_app_restore")
    if temp_dir.exists():
        shutil.rmtree(temp_dir)
    temp_dir.mkdir(parents=True)
    
    for target_rel, info in file_map.items():
        dest = temp_dir / target_rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        print(f"Collecting: {info['path']} -> {target_rel}")
        shutil.copy2(info['path'], dest)

    # 3. WIPE src/app (except for basic stuff we might want to keep if any, but better wipe)
    print("Wiping src/app...")
    for item in base_dir.iterdir():
        if item.is_dir():
            shutil.rmtree(item)
        else:
            item.unlink()

    # 4. RESTORE from temp_dir
    print("Restoring files...")
    for root, dirs, files in os.walk(temp_dir):
        for file in files:
            p = Path(root) / file
            rel = p.relative_to(temp_dir)
            dest = base_dir / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(p, dest)
            print(f"Restored: {dest}")

    shutil.rmtree(temp_dir)
    print("Cleanup done.")

if __name__ == "__main__":
    clean_up()
