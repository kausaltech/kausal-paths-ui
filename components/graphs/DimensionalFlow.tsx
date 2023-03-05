import { gql } from "@apollo/client";
import type { DimensionalPlotFragment } from "common/__generated__/graphql";
import { t } from "i18next";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";


const Plot = dynamic(() => import('components/graphs/Plot'),
  { ssr: false });


type DimensionalPlotProps = {
  flow: DimensionalPlotFragment,
}

function makeSliderSteps(flow: DimensionalPlotFragment) {
  return flow.links.map((link, idx) => {
    const ret: Partial<Plotly.SliderStep> = {
      method: 'animate',
      label: link.year.toString(),
      args: [[link.year.toString()], {
        mode: 'immediate',
        transition: {duration: 100},
        frame: {duration: 300, redraw: false},
      }],
    };
    return ret;
  });
}

function *zip (...iterables){
  let iterators = iterables.map(i => i[Symbol.iterator]() )
  while (true) {
      let results = iterators.map(iter => iter.next() )
      if (results.some(res => res.done) ) return
      else yield results.map(res => res.value )
  }
}

type DataWithSankey = Plotly.Data & {
  link: {
    source: number[],
    target: number[],
    value: (number | null)[]
  },
  node: {
    pad: number,
    thickness: number,
    line: {
      color: string,
      width: number,
    },
    label: string[],
  }
}

type Node = DimensionalPlotFragment['nodes'][0];

function makeFrame(links: DimensionalPlotFragment['links'][0], nodes: Node[], nodeMap: Map<string, number>) {
  const data: DataWithSankey = {
    type: 'sankey',
    orientation: 'h',
    link: {
      source: links.sources.map(id => nodeMap.get(id)!),
      target: links.targets.map(id => nodeMap.get(id)!),
      value: links.values.map(val => val),
    },
    node: {
      pad: 15,
      thickness: 30,
      line: {
        color: "black",
        width: 0.5
      },
      label: nodes.map(node => node.label),
    },
    ids: Array.from(zip(links.sources, links.targets)).map(([s, t]) => `${s}/${t}`),
  };

  data.node.label.push('Heizöl start')
  const hsidx = data.node.label.length - 1;
  data.link.source.push(hsidx);
  data.link.target.push(0);
  const hstart = 1293;
  data.link.value.push(hstart);

  data.link.source.push(hsidx);
  data.link.target.push(0);
  data.link.value.push(500);

  data.node.label.push('Heizöl remaining')
  const heidx = data.node.label.length - 1;
  data.link.source.push(0);
  data.link.target.push(heidx);
  data.link.value.push(223);

  /*
  data.link.source.push(hsidx);
  data.link.target.push(0);
  data.link.value.push(5);
  */
  data.node.label.push('Erdgas start')
  const esidx = data.node.label.length - 1;
  data.link.source.push(esidx);
  data.link.target.push(1);
  data.link.value.push(2858);

  data.node.label.push('Erdgas remaining');
  const eeidx = data.node.label.length - 1;
  data.link.source.push(1);
  data.link.target.push(eeidx);
  data.link.value.push(250);

  /*
  data.link.source.push(esidx);
  data.link.target.push(1);
  data.link.value.push(100);
  */
  console.log(data);
  return data;
}

export default function DimensionalFlow(props: DimensionalPlotProps) {
  const { flow } = props;

  useEffect(() => {
    console.log('flow changed');
  }, [flow])

  const nodeMap = new Map(flow.nodes.map((node, idx) => [node.id, idx]));
  const layout: Partial<Plotly.Layout> = {
  };
  const link = flow.links.find((link) => link.year == 2040)!;
  const data = makeFrame(link, flow.nodes, nodeMap);

  return (
    <div>
      <Plot
        data={[data]}
        layout={layout}
        useResizeHandler
        style={{ width: '100%' }}
        config={{ displayModeBar: false }}
      />
    </div>
  );
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
    }
    links {
      year
      sources
      targets
      values
    }
  }
`;
