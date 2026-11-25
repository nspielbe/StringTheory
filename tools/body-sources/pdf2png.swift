import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers
// pdf2png in.pdf out.png pxPerMm [page]
let a = CommandLine.arguments
guard let doc = CGPDFDocument(URL(fileURLWithPath: a[1]) as CFURL) else { print("cannot open"); exit(1) }
let pxmm = Double(a[3])!
let pageNo = a.count > 4 ? Int(a[4])! : 1
guard let page = doc.page(at: pageNo) else { print("no page"); exit(1) }
let box = page.getBoxRect(.mediaBox)
let s = pxmm * 25.4 / 72.0
let W = Int((Double(box.width) * s).rounded()), H = Int((Double(box.height) * s).rounded())
let cs = CGColorSpaceCreateDeviceGray()
guard let ctx = CGContext(data: nil, width: W, height: H, bitsPerComponent: 8, bytesPerRow: 0, space: cs, bitmapInfo: CGImageAlphaInfo.none.rawValue) else { print("ctx fail \(W)x\(H)"); exit(1) }
ctx.setFillColor(gray: 1, alpha: 1); ctx.fill(CGRect(x: 0, y: 0, width: W, height: H))
ctx.scaleBy(x: CGFloat(s), y: CGFloat(s))
ctx.translateBy(x: -box.origin.x, y: -box.origin.y)
ctx.drawPDFPage(page)
let img = ctx.makeImage()!
let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: a[2]) as CFURL, UTType.png.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(dest, img, nil); CGImageDestinationFinalize(dest)
print("\(W)x\(H) px, page \(box.width / 72 * 25.4) x \(box.height / 72 * 25.4) mm")
