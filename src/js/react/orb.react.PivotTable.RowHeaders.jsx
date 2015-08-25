/** @jsx React.DOM */

/* global module, require, React */

'use strict';

module.exports.PivotTableRowHeaders = react.createClass({
  setColGroup: function(widths) {
    var node = this.getDOMNode();
    var colGroupNode = this.refs.colgroup.getDOMNode();
    node.style.tableLayout = 'auto';

    colGroupNode.innerHTML = '';
    for(var i = 0; i < widths.length; i++) {
      var col = document.createElement('col');
      col.style.width = (widths[i] + 8) + 'px';
      colGroupNode.appendChild(col);
    }
    node.style.tableLayout = 'fixed';
  },
  render: function() {
    var self = this;
    var PivotRow = comps.PivotRow;
    var pgridwidget = this.props.pivotTableComp.pgridwidget;
    var cntrClass = pgridwidget.rows.headers.length === 0 ? '' : ' rows-cntr';
    
    var layoutInfos = { 
      lastLeftMostCellVSpan: 0,
      topMostCells: {}
    };
    var ordering = pgridwidget.rows.headers[0].map(
        function(cell){return cell.dim && cell.dim.field && cell.dim.field.caption ? cell.dim.field.caption.toLowerCase() : 'captionless'})

    var rowHeaders = pgridwidget.rows.headers.map(function(headerRow, index) {
      return <PivotRow key={index}
                       row={headerRow}
                       ordering={ordering}
                       axetype={axe.Type.ROWS}
                       layoutInfos={layoutInfos}
                       pivotTableComp={self.props.pivotTableComp}
                       className="row-header-row">
      </PivotRow>;
    });

    return  <div className={ 'inner-table-container' + cntrClass } ref="rowHeadersContainer" onWheel={this.props.pivotTableComp.onWheel}>
      <table className="inner-table">
          {/*<colgroup ref="colgroup">
             </colgroup>*/}
        <tbody>
          {rowHeaders}
        </tbody>
      </table>
    </div>;
  }
});
