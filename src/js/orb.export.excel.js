/**
 * @fileOverview Pivot Grid export to Excel
 * @author Najmeddine Nouri <najmno@gmail.com>
 */

 'use strict';

 /* global module, require */
 /*jshint eqnull: true*/

var utils = require('./orb.utils');
var uiheaders = require('./orb.ui.header');
var themeManager = require('./orb.themes');

var uriHeader = 'data:application/vnd.ms-excel;base64,';
var docHeader = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">' +
 	'<head>' +
 	'<meta http-equiv=Content-Type content="text/html; charset=UTF-8">' +
 	'<!--[if gte mso 9]><xml>' +
 	' <x:ExcelWorkbook>' +
 	'  <x:ExcelWorksheets>' +
 	'   <x:ExcelWorksheet>' +
 	'    <x:Name>###sheetname###</x:Name>' +
 	'    <x:WorksheetOptions>' +
 	'     <x:ProtectContents>False</x:ProtectContents>' +
 	'     <x:ProtectObjects>False</x:ProtectObjects>' +
 	'     <x:ProtectScenarios>False</x:ProtectScenarios>' +
 	'    </x:WorksheetOptions>' +
 	'   </x:ExcelWorksheet>' +
 	'  </x:ExcelWorksheets>' +
 	'  <x:ProtectStructure>False</x:ProtectStructure>' +
 	'  <x:ProtectWindows>False</x:ProtectWindows>' +
 	' </x:ExcelWorkbook>' +
 	'</xml><![endif]-->' +
 	'</head>' +
 	'<body>';
var docFooter = '</body></html>';

/**
 * Creates a new instance of rows ui properties.
 * @class
 * @memberOf orb.ui
 * @param  {orb.axe} rowsAxe - axe containing all rows dimensions.
 */
 module.exports = function(pgridwidget, filename, metadata) {
    metadata = metadata || {}
 	var config = pgridwidget.pgrid.config;

 	var currTheme = themeManager.current();
 	currTheme = currTheme === 'bootstrap' ? 'white' : currTheme;
 	var override = currTheme === 'white';

 	var buttonTextColor = override ? 'black' : 'white';
 	var themeColor = themeManager.themes[currTheme];
 	var themeFadeout = themeManager.utils.fadeoutColor(themeColor, 0.1);    

 	var buttonStyle = 'style="font-weight: bold; color: ' + buttonTextColor + '; background-color: ' + themeColor + ';" bgcolor="' + themeColor + '"';
 	var headerStyle = 'style="background-color: ' + themeFadeout + ';" bgcolor="' + themeFadeout + '"';

 	function createButtonCell(caption) {
 		return '<td ' + buttonStyle + '><font color="' + buttonTextColor + '">' + caption + '</font></td>';
 	}

 	function createButtons(buttons, cellsCountBefore, cellsCountAfter, prefix) {
 		var i;
 		var str = prefix || '<tr>';
 		for(i = 0; i < cellsCountBefore; i++) {
 			str += '<td></td>';
 		}

 		str += buttons.reduce(function(tr, field) {
 			return (tr += createButtonCell(field.caption));
 		}, '');

 		for(i = 0; i < cellsCountAfter; i++) {
 			str += '<td></td>';
 		}
 		return str + '</tr>';
 	}

 	var cellsHorizontalCount = Math.max(config.dataFields.length + 1, pgridwidget.layout.pivotTable.width);

 	var dataFields = createButtons(config.dataFields, 
 		0,
 		cellsHorizontalCount - config.dataFields.length,
 		'<tr><td><font color="#ccc">Data</font></td>'
 	);

 	var sep = '<tr><td style="height: 22px;" colspan="' + cellsHorizontalCount + '"></td></tr>';

 	var columnFields = createButtons(config.columnFields,
 		pgridwidget.layout.rowHeaders.width,
 		cellsHorizontalCount - (pgridwidget.layout.rowHeaders.width + config.columnFields.length)
 	);

 	var columnHeaders = (function() {
 		var str = '';
 		var j;
 		for(var i = 0; i < pgridwidget.columns.headers.length; i++) {
 			var currRow = pgridwidget.columns.headers[i];
 			var rowStr = '<tr>';
 			if(i < pgridwidget.columns.headers.length - 1) {
 				for(j = 0; j < pgridwidget.layout.rowHeaders.width; j++) {
 					rowStr += '<td></td>';
 				}
 			} else {
 				rowStr += config.rowFields.reduce(function(tr, field) {
 					return (tr += createButtonCell(field.caption));
 				}, '');
 			}

 			rowStr += currRow.reduce(function(tr, header) {
 				var value = header.type === uiheaders.HeaderType.DATA_HEADER ? header.value.caption : header.value;
 				return (tr += '<td ' + headerStyle + ' colspan="' + header.hspan(true) + '" rowspan="' + header.vspan(true) + '">' + value + '</td>');
 			}, '');
 			str += rowStr + '</tr>';
 		}
 		return str;
 	}());
 	var metadataHeaders = (function() {
        var rowStr = '';
        var col = 1;
        for (var key in metadata) {
            if (metadata.hasOwnProperty(key)) {
                rowStr += '<tr><td><b>' + key + '</b></td>';
                rowStr += '<td>' + metadata[key] + '</td></tr>';
                col++;
            }
        }
        rowStr += '</tr>';
 		return rowStr;
 	}());

 	var rowHeadersAndDataCells = (function() {
 		var str = '';
 		var j;
 		for(var i = 0; i < pgridwidget.rows.headers.length; i++) {
 			var currRow = pgridwidget.rows.headers[i];
 			var rowStr = '<tr>';
 			rowStr += currRow.reduce(function(tr, header) {
 				return (tr += '<td ' + headerStyle + ' colspan="' + header.hspan(true) + '" rowspan="' + header.vspan(true) + '">' + header.value + '</td>');
 			}, '');
 			var dataRow = pgridwidget.dataRows[i];
 			rowStr += dataRow.reduce(function(tr, dataCell, index) {
 				var formatFunc = config.dataFields[index = index % config.dataFields.length].formatFunc;
 				var value = dataCell.value == null ? '' : formatFunc ? formatFunc()(dataCell.value) : dataCell.value;
 				return (tr += '<td>' + value + '</td>');
 			}, '');
 			str += rowStr + '</tr>';
 		}
 		return str;
 	}());

 	function toBase64(str) {
 		return utils.btoa(unescape(encodeURIComponent(str)));
 	}

    function download_file(filename, filestring) {
        var a = document.createElement('a');
        a.download = filename + '.xls';
        a.href =  filestring;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    var filestring = uriHeader + toBase64(
        docHeader +
            '<table>' +
                dataFields +
                sep +
                metadataHeaders +
                columnFields +
                columnHeaders +
                rowHeadersAndDataCells +
            '</table>' +
        docFooter
    );
 	return filename ?
        download_file(filename, filestring) :
        filestring;
 };
