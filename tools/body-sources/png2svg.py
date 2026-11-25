"""png2svg.py in.png pxPerMm out.svg  -> SVG wrapper whose user units are millimetres"""
import sys, base64, struct
png = open(sys.argv[1], 'rb').read(); pxmm = float(sys.argv[2])
w, h = struct.unpack('>II', png[16:24])
W, H = w / pxmm, h / pxmm
b64 = base64.b64encode(png).decode()
open(sys.argv[3], 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.3f} {H:.3f}" width="{W:.3f}mm" height="{H:.3f}mm"><image href="data:image/png;base64,{b64}" x="0" y="0" width="{W:.3f}" height="{H:.3f}"/></svg>')
print(sys.argv[3], f'{W:.1f} x {H:.1f} mm', len(b64) // 1024, 'KB')
