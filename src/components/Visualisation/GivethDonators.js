import React from 'react';
import * as d3 from 'd3';

const GivethDonators = ({ donationData }) => {
  React.useEffect(() => {
    console.log('Mounted');
    createNodesAndLinks();
  }, []);

  const getTokenName = (tokenAddress) => {
    if (tokenAddress === "0x0000000000000000000000000000000000000000") return 'ETH';
    else return 'DAI';
  };

  const createNodesAndLinks = () => {
    let includedGiverIds = [];
    let nodes = [];
    let links = [];
    let runningTotal = 0;

    donationData.map(donation => {
      if (!includedGiverIds.includes(donation.giverId)) {
        nodes.push({
          id: donation.giverId,
          isGiver: true,
          amount: convertToEth(donation.amount)
        });
        includedGiverIds.push(donation.giverId);
      } else {
        nodes.forEach(node => {
          if (node.id === donation.giverId) {
            node.amount = convertToEth(donation.amount);
          }
        });
      }
      if (!includedGiverIds.includes(donation.receiverId)) {
        nodes.push({
          id: donation.receiverId,
          isGiver: false,
          amount: convertToEth(donation.amount)
        });
        includedGiverIds.push(donation.receiverId);
      } else {
        nodes.forEach(node => {
          if (node.id === donation.receiverId) {
            node.amount = convertToEth(donation.amount);
          }
        });
      }
      links.push({
        source: donation.giverId,
        target: donation.receiverId,
        amount:donation.amount / (10 ** 18),
        tokenName: getTokenName(donation.token)
    });
      runningTotal += convertToEth(donation.amount);
      return donation;
    });

    drawChart(nodes, links, runningTotal);
    console.log(runningTotal);
  };

  const convertToEth = (amount) => {
    return amount / (10 ** 18)
  }

  const drawChart = (nodes, links, donationTotal) => {
    const height = window.innerHeight;
    const width = window.innerWidth;


    const svg = d3
      .select('#d3-container')
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const containingG = svg.append('g');

    let drag_handler = d3
      .drag()
      .on('start', dragStart)
      .on('drag', dragDrag)
      .on('end', dragEnd);

    let zoomHandler = d3.zoom().on('zoom', zoom_actions);

    drag_handler(containingG);

    zoomHandler(svg);

    const simulation = d3.forceSimulation().nodes(nodes);

    //Create the link force
    //We need the id accessor to use named sources and targets
    let linkForce = d3
      .forceLink(links)
      .id(function(d) {
        return d.id;
      })
      .distance(1000)
      .strength(2.7);

    let chargeForce = d3
      .forceManyBody()
      .strength(-200)
      .distanceMax(200);

    let collisionForce = d3.forceCollide(200);

    simulation
      .force('center_force', d3.forceCenter(width / 2, height / 2))
      .force('links', linkForce)
      .force('collision', collisionForce)
      .force('charge', chargeForce);

    // build the arrow.
    svg
      .append('svg:defs')
      .call(zoomHandler)
      .call(
        zoomHandler.transform,
        d3.zoomIdentity.translate(width / 2, height / 2).scale(0.15, 0.15)
      )
      .selectAll('marker')
      .data(['end']) // Different link/path types can be defined here
      .enter()
      .append('svg:marker') // This section adds in the arrows
      .attr('id', String)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 50)
      .attr('markerHeight', 15)
      .attr('markerUnits', 'strokeWidth')
      .attr('orient', 'auto')
      .append('svg:path')
      .attr('d', 'M0,-5L10,0L0,5');

      // Define the div for the tooltip
      var div = d3.select("body").append("div")
          .attr("class", "tooltip")
          .style("opacity", 0);

    //draw lines for the links
    let link = containingG
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke-width', function(d) {
        const strokeWidth = (d.amount / donationTotal) * 250;

        return strokeWidth > 2 ? strokeWidth : 2;
      })
      .attr('fill', 'blue')
       .on("mouseover", function(d) {
              div.transition()
                  .duration(200)
                  .style("opacity", .9);
              div.html(d.amount + " " + d.tokenName)
                  .style("left", (d3.event.pageX) + "px")
                  .style("top", (d3.event.pageY - 28) + "px");
          })
          .on("mouseout", function(d) {
              div.transition()
                  .duration(500)
                  .style("opacity", 0);
          })
        .attr('marker-end', 'url(#end)');

    let linkText = containingG
      .append('g')
      .selectAll('text')
      .data(links)
      .enter()
      .append('text');

    let linkTextLabels = linkText
      .attr('x', function(d) {
        return (d.source.x + d.target.x) / 2;
      })
      .attr('y', function(d) {
        return (d.source.y + d.target.y) / 2;
      })
      .text(function(d) {
        return '';
      })
      .attr('font-family', 'sans-serif')
      .attr('font-size', '10px');
    // .attr("fill", "black");
    // build the arrow.
    let node = containingG
      .append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', d => {
        // console.log(donationTotal)
        // console.log(d.amount / 10**18 )
        let proportion = d.amount / donationTotal;
        // if (proportion > 1) console.log("ERROR")
/*        console.log(
          'Proportion',
          d.amount,
          proportion,
          d.id,
          'Total',
          20 + 0 * proportion * 100
        );
*/
        return 20 + 3000 * proportion;
      })
      .attr('fill', d => (d.isGiver ? 'purple' : 'teal'));

    let nodeText = containingG
      .append('g')
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text');

    let nodeTextLabels = nodeText
      .attr('x', function(d) {
        return d.x;
      })
      .attr('y', function(d) {
        return d.y;
      })
      .text(function(d) {
        return d.id;
      })
      .attr('font-family', 'sans-serif')
      .attr('font-size', '10px')
      .attr('fill', 'white');

    function tickActions() {
      //update circle positions each tick of the simulation
      node
        .attr('cx', function(d) {
          return d.x;
        })
        .attr('cy', function(d) {
          return d.y;
        });

      //update link positions
      //simply tells one end of the line to follow one node around
      //and the other end of the line to follow the other node around
      link
        .attr('x1', function(d) {
          return d.source.x;
        })
        .attr('y1', function(d) {
          return d.source.y;
        })
        .attr('x2', function(d) {
          return d.target.x;
        })
        .attr('y2', function(d) {
          return d.target.y;
        });

      nodeTextLabels
        .attr('x', function(d) {
          return d.x-10;
        })
        .attr('y', function(d) {
          return d.y+3;
        });

      linkTextLabels
        .attr('x', function(d) {
          return (d.source.x + d.target.x) / 2;
        })
        .attr('y', function(d) {
          return (d.source.y + d.target.y) / 2;
        });
    }

    const dragStart = d => {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    };

    const dragDrag = d => {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    };

    const dragEnd = d => {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    };

    function zoom_actions() {
      containingG.attr('transform', d3.event.transform);
    }

    simulation.on('tick', tickActions);
  };

  return <div id="d3-container"></div>;
};

export default GivethDonators;
