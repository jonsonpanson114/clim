import os
import shutil
from pathlib import Path

root_dir = Path(r"c:\Users\jonso\.gemini\clim\src\app")

def merge_nested_dirs():
    # 1. Flatten (app)
    bad_app = root_dir / "(app)" / ")"
    if bad_app.exists():
        print(f"Flattening {bad_app}...")
        for item in bad_app.iterdir():
            dest = root_dir / "(app)" / item.name
            if dest.exists():
                if dest.is_dir():
                    # Move sub-contents
                    for sub in item.iterdir():
                        sub_dest = dest / sub.name
                        if sub_dest.exists():
                             if sub_dest.is_dir(): shutil.rmtree(sub_dest)
                             else: sub_dest.unlink()
                        shutil.move(str(sub), str(dest))
                    item.rmdir()
                else:
                    dest.unlink()
                    shutil.move(str(item), str(dest))
            else:
                shutil.move(str(item), str(dest))
        bad_app.rmdir()

    # 2. Flatten quiz
    bad_quiz = root_dir / "api" / "quiz" / "[id]" / "]"
    if bad_quiz.exists():
        print(f"Flattening {bad_quiz}...")
        for item in bad_quiz.iterdir():
            dest = root_dir / "api" / "quiz" / "[id]" / item.name
            if dest.exists():
                dest.unlink()
            shutil.move(str(item), str(dest))
        bad_quiz.rmdir()

    # 3. Flatten videos (if any remained nested)
    # Check etc...

if __name__ == "__main__":
    merge_nested_dirs()
