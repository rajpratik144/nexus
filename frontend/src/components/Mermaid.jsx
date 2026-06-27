import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
        padding: 20 // Add some breathing room
    }
});


const Mermaid = ({ chart }) => {
    const ref = useRef(null);
    const [error, setError] = useState(null);

    // This function tries to fix common AI mistakes (like missing quotes)
    const preprocessChart = (code) => {
        return code
            .split('\n')
            .map(line => {
                // Find patterns like A[Text] and change to A["Text"]
                return line.replace(/(\w+)\s*\[(.*?)\]/g, '$1["$2"]')
                    .replace(/(\w+)\s*\((.*?)\)/g, '$1["$2"]');
            })
            .join('\n');
    };

    useEffect(() => {
        const renderDiagram = async () => {
            if (ref.current && chart) {
                try {
                    setError(null);
                    ref.current.innerHTML = "";
                    const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

                    const cleanChart = preprocessChart(chart);
                    const { svg } = await mermaid.render(id, cleanChart);
                    ref.current.innerHTML = svg;
                } catch (err) {
                    setError(chart);
                    // If mermaid fails, it leaves a "bomb" icon in the body. We remove it.
                    const errorSvg = document.getElementById('dmermaid');
                    if (errorSvg) errorSvg.remove();
                }
            }
        };
        renderDiagram();
    }, [chart]);

    if (error) {
        return (
            <div className="my-4 p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Diagram Source</p>
                <pre className="text-xs text-blue-400 overflow-x-auto">{error}</pre>
            </div>
        );
    }

    return (
        <div className="w-full my-8 group">
            <div
                ref={ref}
                className="mermaid-container border border-slate-200 dark:border-slate-800"
            />
            <p className="text-[10px] text-center text-slate-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                Nexus Generated Architecture
            </p>
        </div>
    );
};

export default Mermaid;