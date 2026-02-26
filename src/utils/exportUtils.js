import { jsPDF } from 'jspdf';
import { THEMES } from './constants';

export const exportToPNG = (stageRef) => {
    if (!stageRef) return;
    const dataURL = stageRef.toDataURL({ pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = `swiftplan-export-${new Date().toISOString().split('T')[0]}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const exportToPDF = (stageRef, themeName = 'light') => {
    if (!stageRef) return;
    const dataURL = stageRef.toDataURL({ pixelRatio: 2 });

    // A4 dimensions: 210 x 297 mm
    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Calculate aspect ratio to fit the image
    const imgProps = pdf.getImageProperties(dataURL);
    const imgRatio = imgProps.width / imgProps.height;
    const pdfRatio = pdfWidth / pdfHeight;

    let finalWidth = pdfWidth;
    let finalHeight = pdfHeight;
    let xOffset = 0;
    let yOffset = 0;

    if (imgRatio > pdfRatio) {
        finalHeight = pdfWidth / imgRatio;
        yOffset = (pdfHeight - finalHeight) / 2;
    } else {
        finalWidth = pdfHeight * imgRatio;
        xOffset = (pdfWidth - finalWidth) / 2;
    }

    if (themeName !== 'light') {
        pdf.setFillColor(THEMES[themeName].bg);
        pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
    }

    pdf.addImage(dataURL, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
    pdf.save(`swiftplan-document-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportToDrawio = (projectState) => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<mxfile version="21.6.8" type="device">\n`;
    xml += `  <diagram id="swiftplan-export" name="Floorplan">\n`;
    xml += `    <mxGraphModel dx="1000" dy="1000" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">\n`;
    xml += `      <root>\n`;
    xml += `        <mxCell id="0" />\n`;
    xml += `        <mxCell id="1" parent="0" />\n`;

    // Draw.io IDs must be unique
    let idCounter = 2;

    const { walls, rooms, furniture } = projectState;

    // Export Rooms as grouped polygons
    rooms.forEach(room => {
        xml += `        <mxCell id="${idCounter++}" value="${(room.area / 1000000).toFixed(2)}m²" style="shape=polygon;fillColor=#eef1f5;strokeColor=#cbd5e1;pointerEvents=1;" vertex="1" parent="1">\n`;
        // Draw.io expects width/height for bounding box
        const xs = room.points.map(p => p.x);
        const ys = room.points.map(p => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const w = Math.max(...xs) - minX;
        const h = Math.max(...ys) - minY;
        xml += `          <mxGeometry x="${minX}" y="${minY}" width="${w}" height="${h}" as="geometry" />\n`;
        xml += `        </mxCell>\n`;
    });

    // Export Walls as distinct lines
    walls.forEach(wall => {
        xml += `        <mxCell id="${idCounter++}" value="" style="endArrow=none;html=1;rounded=0;strokeWidth=${wall.thickness};strokeColor=#334155;" edge="1" parent="1">\n`;
        xml += `          <mxGeometry width="50" height="50" relative="1" as="geometry">\n`;
        xml += `            <mxPoint x="${wall.x1}" y="${wall.y1}" as="sourcePoint" />\n`;
        xml += `            <mxPoint x="${wall.x2}" y="${wall.y2}" as="targetPoint" />\n`;
        xml += `          </mxGeometry>\n`;
        xml += `        </mxCell>\n`;
    });

    // Export Furniture as rectangles with names
    furniture.forEach(item => {
        xml += `        <mxCell id="${idCounter++}" value="${item.name}" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f8fafc;strokeColor=#94a3b8;" vertex="1" parent="1">\n`;
        xml += `          <mxGeometry x="${item.x}" y="${item.y}" width="${item.width}" height="${item.height}" as="geometry" />\n`;
        xml += `        </mxCell>\n`;
    });

    xml += `      </root>\n`;
    xml += `    </mxGraphModel>\n`;
    xml += `  </diagram>\n`;
    xml += `</mxfile>`;

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swiftplan-drawio-${new Date().toISOString().split('T')[0]}.drawio.xml`;
    a.click();
    URL.revokeObjectURL(url);
};
