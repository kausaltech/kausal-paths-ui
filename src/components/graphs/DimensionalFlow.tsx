import { gql, useReactiveVar } from "@apollo/client";
import { yearRangeVar } from "common/cache";
import { genColorsFromTheme } from "common/colors";
import type { DimensionalPlotFragment } from "common/__generated__/graphql";
import { tint, transparentize } from "polished";
import { useEffect, useMemo, } from "react";
import { useTheme } from "styled-components";
import type Plotly from "plotly.js";


type DimensionalPlotProps = {
  flow: DimensionalPlotFragment,
}

type Flow = DimensionalPlotFragment;

type FlowNode = DimensionalPlotFragment['nodes'][0] & {
  idx: number,
  color: string,
  linkColor?: string,
}

type FlowLink = DimensionalPlotFragment['links'][0];


type DataWithSankey = Plotly.Data & {
  link: {
    source: number[],
    target: number[],
    value: (number | null)[]
    color: (string | null)[],
  },
  node: {
    pad: number,
    thickness: number,
    line: {
      color: string,
      width: number,
    },
    label: string[],
    hovertemplate?: string,
    color?: string[],
  },
  ids?: string[],
  valueformat?: string,
}

function makeFrame(flow: Flow, start: FlowLink, link: FlowLink, nodeMap: Map<string, FlowNode>) {
  const nodes = Array.from(nodeMap.values());
  const data: DataWithSankey = {
    type: 'sankey',
    orientation: 'h',
    link: {
      source: [],
      target: [],
      value: [],
      color: [],
      //label: [],
      //hovertemplate: `%{label}<extra>%{value:,.3r} ${flow.unit.htmlLong}</extra>`,
    },
    ids: [],
    node: {
      hovertemplate: `%{label}<extra>%{value:,.3r} ${flow.unit.htmlLong}</extra>`,
      pad: 15,
      thickness: 30,
      line: {
        color: "black",
        width: 0.5
      },
      label: nodes.map(node => `${link.year}: ${node.label}`),
      color: nodes.map(node => node.color),
    },
    valueformat: `,.3r`,
  };

  function newFlow(idPrefix: string, src: number, dest: number, val: number | null, color: string | undefined, custom: any) {
    data.link.source.push(src);
    data.link.target.push(dest);
    data.link.value.push(val);
    data.link.color.push(color ?? null);
    data.ids!.push(`${idPrefix}-${src}-${dest}`);
  }

  link.sources.forEach((srcId, idx) => {
    const src = nodeMap.get(srcId)!;
    const target = nodeMap.get(link.targets[idx])!;
    const value = link.values[idx];
    newFlow('action', src.idx, target.idx, value, src.linkColor, {});
  })

  const impactSum = new Map<string, number>();
  link.sources.forEach((id, idx) => {
    const newVal = (impactSum.get(id) ?? 0) + (link.values[idx] ?? 0);
    impactSum.set(id, newVal);
  });

  function newNode(node: FlowNode, label: string | null = null) {
    const idx = data.node.label.length;
    data.node.label.push(label ?? node.label);
    data.node.color!.push(node.color);
    return idx;
  }

  flow.sources.forEach((srcId, srcIdx) => {
    const src = nodeMap.get(srcId)!;
    const startIdx = newNode(src, `${start.year.toString()}: ${src.label}`);
    const startVal = start.absoluteSourceValues[srcIdx];

    const remainingVal = link.absoluteSourceValues[srcIdx];
    const remainingIdx = newNode(src, `${link.year.toString()}: ${src.label}`);

    const impact = impactSum.get(srcId)!;
    const remainingLinkColor = src.linkColor ? tint(0.5, src.linkColor) : undefined;
    newFlow('start-remaining', startIdx, src.idx, remainingVal, remainingLinkColor, {});
    newFlow('start-impact', startIdx, src.idx, impact, src.linkColor, {});
    newFlow('start-other', startIdx, src.idx, startVal - impact - remainingVal, remainingLinkColor, {});

    newFlow('action-remaining', src.idx, remainingIdx, remainingVal, remainingLinkColor, {});
  });

  return data;
}

const usePlotlyBasic = process.browser && (await import('components/graphs/Plot')).usePlotlyBasic;

export default function DimensionalFlow(props: DimensionalPlotProps) {
  if (!usePlotlyBasic) return;
  const { flow } = props;
  const theme = useTheme();
  const [startYear, endYear] = useReactiveVar(yearRangeVar);

  useEffect(() => {
    console.log('flow changed');
  }, [flow])

  const data = useMemo(() => {
    const year = Math.max(flow.links[0].year + 1, endYear);
    const flowNodesWithoutColors = flow.nodes.filter(node => !node.color);
    const colors = genColorsFromTheme(theme, flowNodesWithoutColors.length);
    let colorIdx = 0;
    const nodeMap = new Map(flow.nodes.map((node, idx) => {
      const out: FlowNode = {
        ...node,
        idx,
        color: node.color ?? colors[colorIdx++],
      };
      out.linkColor = transparentize(0.4, tint(0.5, out.color!));
      return [out.id, out]
    }));
    const start = flow.links[0];
    const current = flow.links.find((link) => link.year == year)!;
    return [makeFrame(flow, start, current, nodeMap)];
  }, [flow, endYear]);

  const layout = useMemo(() => {
    const out: Partial<Plotly.Layout> = {
      height: 300,
      margin: {
        t: 24,
        r: 24,
        b: 24,
        l: 24,
      },
    };
    return out;
  }, []);
  const config = useMemo(() => {
    const out: Partial<Plotly.Config> = {
      displayModeBar: false,
    };
    return out;
  }, []);

  const ref = usePlotlyBasic({ data: data, layout, config  });

  // TODO: How to have useResizeHandler work with usePlotlyBasic?
  // The resulting graph is not responsive with this implementation.

  return (
    <div ref={ref} style={{ width: '100%' }} />
  )
}

DimensionalFlow.fragment = gql`
  fragment DimensionalPlot on DimensionalFlowType {
    id
    unit {
      htmlLong
    }
    nodes {
      id
      label
      color
    }
    sources
    links {
      year
      sources
      targets
      values
      absoluteSourceValues
    }
  }
`;
