"""
Script to extract frames from nobg V1.mov and generate:
1. apps/web/public/brand/xydv-logo-nobg.webp
2. apps/web/public/favicon.ico (16x16, 32x32, 48x48)
3. apps/web/src/app/favicon.ico (16x16, 32x32, 48x48)
4. apps/web/src/app/icon.png (32x32)
5. apps/web/src/app/apple-icon.png (180x180)
"""

import os
import av
from PIL import Image

def generate_animated_webp():
    mov_path = 'nobg V1.mov'
    output_webp = os.path.join('apps', 'web', 'public', 'brand', 'xydv-logo-nobg.webp')
    
    container = av.open(mov_path)
    video = container.streams.video[0]
    
    # Bounding box of the rotating emblem across all 144 frames is x=[204, 869], y=[210, 894]
    # Symmetrical 700x700 envelope centered on (537, 552)
    crop_box = (187, 202, 887, 902)
    target_size = (160, 160)
    
    frames = []
    for frame in container.decode(video):
        arr = frame.reformat(format='rgba').to_ndarray()
        im = Image.fromarray(arr, 'RGBA')
        cropped = im.crop(crop_box)
        resized = cropped.resize(target_size, Image.Resampling.LANCZOS)
        frames.append(resized)
    
    print(f"Decoded {len(frames)} total frames from {mov_path}")
    
    # Select 72 frames (every 2nd frame) for 15 fps / 66ms duration
    frames_72 = frames[::2]
    
    # Save animated WebP with transparency
    os.makedirs(os.path.dirname(output_webp), exist_ok=True)
    frames_72[0].save(
        output_webp,
        format='WEBP',
        save_all=True,
        append_images=frames_72[1:],
        duration=66,
        loop=0,
        quality=80,
        method=6
    )
    
    file_size_kb = os.path.getsize(output_webp) / 1024
    print(f"Generated {output_webp}: {len(frames_72)} frames, {file_size_kb:.1f} KB")

def generate_tab_icons():
    logo_src = os.path.join('apps', 'web', 'public', 'brand', 'xydv-logo.png')
    logo = Image.open(logo_src).convert('RGBA')
    
    # Target paths
    public_favicon = os.path.join('apps', 'web', 'public', 'favicon.ico')
    app_favicon = os.path.join('apps', 'web', 'src', 'app', 'favicon.ico')
    app_icon = os.path.join('apps', 'web', 'src', 'app', 'icon.png')
    app_apple_icon = os.path.join('apps', 'web', 'src', 'app', 'apple-icon.png')
    
    # Multi-resolution favicon.ico
    logo.save(public_favicon, format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
    print(f"Generated {public_favicon} ({os.path.getsize(public_favicon)} bytes)")
    
    logo.save(app_favicon, format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
    print(f"Generated {app_favicon} ({os.path.getsize(app_favicon)} bytes)")
    
    # icon.png (32x32)
    icon_32 = logo.resize((32, 32), Image.Resampling.LANCZOS)
    icon_32.save(app_icon, format='PNG')
    print(f"Generated {app_icon} ({os.path.getsize(app_icon)} bytes)")
    
    # apple-icon.png (180x180)
    icon_180 = logo.resize((180, 180), Image.Resampling.LANCZOS)
    icon_180.save(app_apple_icon, format='PNG')
    print(f"Generated {app_apple_icon} ({os.path.getsize(app_apple_icon)} bytes)")

if __name__ == '__main__':
    generate_animated_webp()
    generate_tab_icons()
