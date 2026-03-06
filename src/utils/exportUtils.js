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

export const exportToPDF = async (stageRef, themeName = 'light', options = {}) => {
    if (!stageRef) return;
    const { jsPDF } = await import('jspdf');
    const dataURL = stageRef.toDataURL({ pixelRatio: 2 });

    const {
        paperSize = 'a4',
        orientation = 'landscape',
        scalePreset = null // e.g. '1:50', '1:100', '1:200'
    } = options;

    const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: paperSize
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

    // Add scale info if preset specified
    if (scalePreset) {
        pdf.setFontSize(8);
        pdf.setTextColor(100);
        pdf.text(`Scale: ${scalePreset}`, 5, pdfHeight - 5);
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

    // Export Rooms as actual polygons with proper point coordinates
    rooms.forEach(room => {
        const xs = room.points.map(p => p.x);
        const ys = room.points.map(p => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const w = Math.max(...xs) - minX;
        const h = Math.max(...ys) - minY;
        const pointsStr = room.points.map(p => `${w > 0 ? ((p.x - minX) / w).toFixed(4) : 0},${h > 0 ? ((p.y - minY) / h).toFixed(4) : 0}`).join('],[');
        const areaLabel = room.area ? `${(room.area / 1000000).toFixed(2)}m²` : '';
        xml += `        <mxCell id="${idCounter++}" value="${areaLabel}" style="shape=polygon;perimeter=polygonPerimeter2;points=[[${pointsStr}]];fillColor=#eef1f5;strokeColor=#cbd5e1;pointerEvents=1;" vertex="1" parent="1">\n`;
        xml += `          <mxGeometry x="${minX}" y="${minY}" width="${w}" height="${h}" as="geometry" />\n`;
        xml += `        </mxCell>\n`;
    });

    // Export Walls as distinct lines (thickness in points, not mm)
    walls.forEach(wall => {
        const strokePt = Math.max(1, Math.round((wall.thickness || 200) / 50));
        xml += `        <mxCell id="${idCounter++}" value="" style="endArrow=none;html=1;rounded=0;strokeWidth=${strokePt};strokeColor=#334155;" edge="1" parent="1">\n`;
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
