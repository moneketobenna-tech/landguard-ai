# LandGuard AI Favicon Generator using .NET
Add-Type -AssemblyName System.Drawing

$outputDir = "C:\Users\Toby\Desktop\landguard-ai\website\public"

# Create a 64x64 image for favicon
$size = 64
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$graphics = [System.Drawing.Graphics]::FromImage($bmp)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

# Create gradient for shield (blue)
$rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
$brush1 = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $rect,
    [System.Drawing.Color]::FromArgb(74, 144, 226),  # #4A90E2
    [System.Drawing.Color]::FromArgb(44, 95, 158),   # #2C5F9E
    [System.Drawing.Drawing2D.LinearGradientMode]::Vertical
)

# Draw shield shape
$shieldPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$points = @(
    [System.Drawing.PointF]::new($size * 0.5, $size * 0.05),
    [System.Drawing.PointF]::new($size * 0.85, $size * 0.2),
    [System.Drawing.PointF]::new($size * 0.85, $size * 0.6),
    [System.Drawing.PointF]::new($size * 0.7, $size * 0.75),
    [System.Drawing.PointF]::new($size * 0.5, $size * 0.95),
    [System.Drawing.PointF]::new($size * 0.3, $size * 0.75),
    [System.Drawing.PointF]::new($size * 0.15, $size * 0.6),
    [System.Drawing.PointF]::new($size * 0.15, $size * 0.2)
)
$shieldPath.AddPolygon($points)
$graphics.FillPath($brush1, $shieldPath)

# Draw shield border
$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(91, 163, 255), 2)
$graphics.DrawPath($pen, $shieldPath)

# Draw location pin (red circle)
$pinX = $size * 0.5
$pinY = $size * 0.4
$pinR = $size * 0.18
$redBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(231, 76, 60))
$graphics.FillEllipse($redBrush, $pinX - $pinR, $pinY - $pinR, $pinR * 2, $pinR * 2)

# Draw pin point (triangle)
$pinPoints = @(
    [System.Drawing.PointF]::new($pinX - $pinR * 0.5, $pinY + $pinR * 0.8),
    [System.Drawing.PointF]::new($pinX, $pinY + $pinR * 1.8),
    [System.Drawing.PointF]::new($pinX + $pinR * 0.5, $pinY + $pinR * 0.8)
)
$graphics.FillPolygon($redBrush, $pinPoints)

# Draw white circle in pin
$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$innerR = $pinR * 0.45
$graphics.FillEllipse($whiteBrush, $pinX - $innerR, $pinY - $innerR, $innerR * 2, $innerR * 2)

# Save as favicon.ico
$faviconPath = Join-Path $outputDir "favicon.ico"
$bmp.Save($faviconPath, [System.Drawing.Imaging.ImageFormat]::Png)

Write-Host "Favicon created at: $faviconPath" -ForegroundColor Green

# Cleanup
$graphics.Dispose()
$bmp.Dispose()
$brush1.Dispose()
$pen.Dispose()
$redBrush.Dispose()
$whiteBrush.Dispose()
$shieldPath.Dispose()

