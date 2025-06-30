export function rgbaToHex(color: any): string {
    // skip if color is already hex
    if (color.startsWith('#')) {
      return color;
    }
  
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    const a = Math.round(color.a * 255);
  
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}${a === 255 ? '' : a.toString(16).padStart(2, '0')}`;
  }
  
export function filterFigmaNode(node: any) {
    // Skip VECTOR type nodes
    if (node.type === "VECTOR") {
      return null;
    }
  
    const filtered: any = {
      id: node.id,
      name: node.name,
      type: node.type,
    };
  
    if (node.fills && node.fills.length > 0) {
      filtered.fills = node.fills.map((fill: any) => {
        const processedFill = { ...fill };
  
        // Remove boundVariables and imageRef
        delete processedFill.boundVariables;
        delete processedFill.imageRef;
  
        // Process gradientStops if present
        if (processedFill.gradientStops) {
          processedFill.gradientStops = processedFill.gradientStops.map((stop: any) => {
            const processedStop = { ...stop };
            // Convert color to hex if present
            if (processedStop.color) {
              processedStop.color = rgbaToHex(processedStop.color);
            }
            // Remove boundVariables
            delete processedStop.boundVariables;
            return processedStop;
          });
        }
  
        // Convert solid fill colors to hex
        if (processedFill.color) {
          processedFill.color = rgbaToHex(processedFill.color);
        }
  
        return processedFill;
      });
    }
  
    if (node.strokes && node.strokes.length > 0) {
      filtered.strokes = node.strokes.map((stroke: any) => {
        const processedStroke = { ...stroke };
        // Remove boundVariables
        delete processedStroke.boundVariables;
        // Convert color to hex if present
        if (processedStroke.color) {
          processedStroke.color = rgbaToHex(processedStroke.color);
        }
        return processedStroke;
      });
    }
  
    if (node.cornerRadius !== undefined) {
      filtered.cornerRadius = node.cornerRadius;
    }
  
    if (node.absoluteBoundingBox) {
      filtered.absoluteBoundingBox = node.absoluteBoundingBox;
    }
  
    if (node.characters) {
      filtered.characters = node.characters;
    }
  
    if (node.style) {
      filtered.style = {
        fontFamily: node.style.fontFamily,
        fontStyle: node.style.fontStyle,
        fontWeight: node.style.fontWeight,
        fontSize: node.style.fontSize,
        textAlignHorizontal: node.style.textAlignHorizontal,
        letterSpacing: node.style.letterSpacing,
        lineHeightPx: node.style.lineHeightPx
      };
    }
  
    if (node.children) {
      filtered.children = node.children
        .map((child: any) => filterFigmaNode(child))
        .filter((child: any) => child !== null); // Remove null children (VECTOR nodes)
    }
  
    return filtered;
  }