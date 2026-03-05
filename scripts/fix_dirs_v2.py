import os
import shutil
from pathlib import Path

root_dir = Path(r"c:\Users\jonso\.gemini\clim\src\app")

def fix_messy_paths():
    for root, dirs, files in os.walk(root_dir, topdown=False):
        for d in dirs:
            original_dir = Path(root) / d
            normalized_name = d.strip()
            # Remove trailing slashes (Windows might show them differently)
            normalized_name = normalized_name.rstrip('/').rstrip('\\')
            
            # Specific mapping
            new_name = normalized_name
            if normalized_name in ["(app", "(app/", "(app\\", "(app/)", "(app\\)"]:
                new_name = "(app)"
            elif normalized_name in ["[id", "[id/", "[id\\", "[id/]", "[id\\]"]:
                new_name = "[id]"
            
            if new_name != d:
                target_dir = Path(root) / new_name
                print(f"Renaming: {original_dir} -> {target_dir}")
                if target_dir.exists():
                    print(f"Target already exists, merging...")
                    for item in original_dir.iterdir():
                        dest = target_dir / item.name
                        if dest.exists():
                            if dest.is_dir():
                                # shutil.rmtree(dest) # or merge recursive
                                pass 
                            else:
                                dest.unlink()
                        shutil.move(str(item), str(target_dir))
                    original_dir.rmdir()
                else:
                    os.rename(str(original_dir), str(target_dir))

if __name__ == "__main__":
    fix_messy_paths()
