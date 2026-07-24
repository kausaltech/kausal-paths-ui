import { useMemo } from 'react';

import { gql } from '@apollo/client';
import { useReactiveVar } from '@apollo/client/react';
import { SankeyChart } from 'echarts/charts';
import type { EChartsCoreOption } from 'echarts/core';
import * as echarts from 'echarts/core';
import { tint, transparentize } from 'polished';

import { Chart } from '@common/components/Chart';
import { useTheme } from '@common/themes';

import type { DimensionalPlotFragment } from '@/common/__generated__/graphql';
import { yearRangeVar } from '@/common/cache';
import { genColorsFromTheme } from '@/common/colors';
import { useNumberFormatter } from '@/common/numbers';

// The sankey module is registered here rather than in the shared Chart
// wrapper: this is the only chart using it, and this way it's bundled into
// the actions route chunk instead of every chart-bearing page.
echarts.use([SankeyChart]);

type DimensionalPlotProps = {
  flow: DimensionalPlotFragment;
};

type Flow = DimensionalPlotFragment;

type FlowNode = Flow['nodes'][0] & {
  color: string;
  linkColor: string;
};

type FlowLink = Flow['links'][0];

// The same flow node appears in several sankey columns (start year, selected
// year, remaining), and ECharts sankey links reference nodes by name — so
// nodes get unique internal names and carry the visible text separately.
type SankeyNode = {
  name: string;
  displayName: string;
  itemStyle: { color: string };
};

type SankeyLink = {
  source: string;
  target: string;
  value: number;
  lineStyle: { color: string; opacity: number };
};

function makeSankey(flow: Flow, start: FlowLink, link: FlowLink, nodeMap: Map<string, FlowNode>) {
  const nodes: SankeyNode[] = [];
  const links: SankeyLink[] = [];

  const addNode = (name: string, displayName: string, color: string) => {
    nodes.push({ name, displayName, itemStyle: { color } });
  };
  const addLink = (source: string, target: string, value: number | null, color: string) => {
    if (value == null || value <= 0) return;
    // The link colors carry their own alpha; ECharts' default link opacity
    // (0.2) would double-fade them
    links.push({ source, target, value, lineStyle: { color, opacity: 1 } });
  };

  // Middle column: every flow node at the currently selected year
  nodeMap.forEach((node) => {
    addNode(`now:${node.id}`, `${link.year}: ${node.label}`, node.color);
  });

  // Action impacts: source → target flows in the selected year
  link.sources.forEach((srcId, idx) => {
    const src = nodeMap.get(srcId)!;
    addLink(`now:${srcId}`, `now:${link.targets[idx]}`, link.values[idx], src.linkColor);
  });

  const impactSum = new Map<string, number>();
  link.sources.forEach((id, idx) => {
    impactSum.set(id, (impactSum.get(id) ?? 0) + (link.values[idx] ?? 0));
  });

  // Left column: each source at the start year; right column: what remains
  // of it at the selected year
  flow.sources.forEach((srcId, srcIdx) => {
    const src = nodeMap.get(srcId)!;
    addNode(`start:${srcId}`, `${start.year}: ${src.label}`, src.color);
    addNode(`remaining:${srcId}`, `${link.year}: ${src.label}`, src.color);

    const startVal = start.absoluteSourceValues[srcIdx];
    const remainingVal = link.absoluteSourceValues[srcIdx];
    const impact = impactSum.get(srcId) ?? 0;
    const remainingColor = tint(0.5, src.linkColor);

    addLink(`start:${srcId}`, `now:${srcId}`, remainingVal, remainingColor);
    addLink(`start:${srcId}`, `now:${srcId}`, impact, src.linkColor);
    addLink(`start:${srcId}`, `now:${srcId}`, startVal - impact - remainingVal, remainingColor);
    addLink(`now:${srcId}`, `remaining:${srcId}`, remainingVal, remainingColor);
  });

  return { nodes, links };
}

export default function DimensionalFlow(props: DimensionalPlotProps) {
  const { flow } = props;
  const theme = useTheme();
  const formatNumber = useNumberFormatter();
  const [, endYear] = useReactiveVar(yearRangeVar);

  const chartData: EChartsCoreOption = useMemo(() => {
    const year = Math.max(flow.links[0].year + 1, endYear);
    const flowNodesWithoutColors = flow.nodes.filter((node) => !node.color);
    const colors = genColorsFromTheme(theme, flowNodesWithoutColors.length);
    let colorIdx = 0;
    const nodeMap = new Map(
      flow.nodes.map((node) => {
        const color = node.color ?? colors[colorIdx++];
        const out: FlowNode = {
          ...node,
          color,
          linkColor: transparentize(0.4, tint(0.5, color)),
        };
        return [out.id, out];
      })
    );
    const start = flow.links[0];
    const current = flow.links.find((link) => link.year == year)!;
    const { nodes, links } = makeSankey(flow, start, current, nodeMap);

    const displayNames = new Map(nodes.map((node) => [node.name, node.displayName]));
    const unit = flow.unit.htmlLong;

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) => {
          const p = params as {
            dataType?: string;
            name?: string;
            value?: number;
            data?: { source?: string; target?: string; displayName?: string };
          };
          const value =
            typeof p.value === 'number' ? `<b>${formatNumber(p.value)}</b> ${unit}` : '';
          if (p.dataType === 'edge' && p.data?.source && p.data?.target) {
            const from = displayNames.get(p.data.source) ?? p.data.source;
            const to = displayNames.get(p.data.target) ?? p.data.target;
            return `${from} → ${to}<br/>${value}`;
          }
          return `${p.data?.displayName ?? p.name ?? ''}<br/>${value}`;
        },
      },
      series: [
        {
          type: 'sankey',
          left: 24,
          top: 24,
          bottom: 24,
          nodeWidth: 30,
          nodeGap: 15,
          draggable: false,
          emphasis: { focus: 'adjacency' },
          itemStyle: {
            borderColor: 'black',
            borderWidth: 0.5,
          },
          label: {
            formatter: (params: unknown) =>
              (params as { data?: { displayName?: string } }).data?.displayName ?? '',
          },
          data: nodes,
          links,
        },
      ],
    };
  }, [flow, endYear, theme, formatNumber]);

  return <Chart isLoading={false} data={chartData} height="300px" withResizeLegend={false} />;
}

DimensionalFlow.fragment = gql`
  fragment DimensionalPlot on DimensionalFlowType {
    id
    unit {
      id
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
