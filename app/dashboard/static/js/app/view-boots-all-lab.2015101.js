/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/error',
    'utils/init',
    'utils/request',
    'utils/tables',
    'utils/html',
    'utils/date'
], function($, e, init, r, t, html) {
    'use strict';
    var dateRange,
        labName,
        pageLen,
        searchFilter;

    function getBootsFail() {
        html.removeElement(document.getElementById('table-loading'));
        html.replaceContent(
            document.getElementById('table-div'),
            html.errorDiv('Error loading data.'));
    }

    function getBootsDone(response) {
        var bootsTable,
            columns,
            resLen,
            results,
            rowURLFmt;

        results = response.result;
        resLen = results.length;

        if (resLen > 0) {
            bootsTable = t(
                ['boots-table', 'table-loading', 'table-div'], true);

            columns = [
                {
                    data: '_id',
                    visible: false,
                    searchable: false,
                    orderable: false
                },
                {
                    data: 'job',
                    title: 'Tree &dash; Branch',
                    type: 'string',
                    className: 'tree-column',
                    render: function(data, type, object) {
                        var aNode,
                            branch,
                            branchNode,
                            rendered,
                            tooltipNode;

                        branch = object.git_branch;
                        rendered = data;

                        if (branch !== null && branch !== undefined) {
                            rendered = rendered + ' ' + branch;
                        }

                        if (type === 'display') {
                            tooltipNode = html.tooltip();
                            tooltipNode.setAttribute(
                                'title', 'Boot reports for&nbsp;' + data);

                            aNode = document.createElement('a');
                            aNode.className = 'table-link';
                            aNode.setAttribute(
                                'href', '/boot/all/job/' + data + '/');

                            aNode.appendChild(document.createTextNode(data));

                            if (branch !== null && branch !== undefined) {
                                branchNode = document.createElement('small');
                                branchNode.appendChild(
                                    document.createTextNode(branch));

                                aNode.insertAdjacentHTML(
                                    'beforeend', '&nbsp;&dash;&nbsp;');
                                aNode.appendChild(branchNode);
                            }

                            tooltipNode.appendChild(aNode);

                            rendered = tooltipNode.outerHTML;
                        }

                        return rendered;
                    }
                },
                {
                    data: 'kernel',
                    title: 'Kernel',
                    type: 'string',
                    className: 'kernel-column',
                    render: function(data, type, object) {
                        var aNode,
                            job,
                            tooltipNode,
                            rendered;

                        rendered = data;
                        if (type === 'display') {
                            job = object.job;
                            tooltipNode = html.tooltip();
                            tooltipNode.setAttribute(
                                'title',
                                'Boot reports for&nbsp;' + job +
                                '&nbsp;&dash;&nbsp;' + data
                            );

                            aNode = document.createElement('a');
                            aNode.className = 'table-link';
                            aNode.setAttribute(
                                'href',
                                '/boot/all/job/' + job + '/kernel/' +
                                data + '/'
                            );

                            aNode.appendChild(document.createTextNode(data));
                            tooltipNode.appendChild(aNode);

                            rendered = tooltipNode.outerHTML;
                        }

                        return rendered;
                    }
                },
                {
                    data: 'board',
                    title: 'Board Model',
                    className: 'board-column',
                    render: function(data, type, object) {
                        var aNode,
                            job,
                            kernel,
                            tooltipNode,
                            rendered;

                        rendered = data;
                        if (type === 'display') {
                            job = object.job;
                            kernel = object.kernel;

                            tooltipNode = html.tooltip();
                            tooltipNode.setAttribute(
                                'title',
                                'Boot reports for board&nbsp;' + data +
                                '&nbsp;with&nbsp;' + job +
                                '&nbsp;&dash;&nbsp;' + kernel
                            );

                            aNode = document.createElement('a');
                            aNode.className = 'table-link';
                            aNode.setAttribute(
                                'href',
                                '/boot/' + data + '/job/' + job +
                                '/kernel/' + kernel + '/'
                            );

                            aNode.appendChild(document.createTextNode(data));
                            tooltipNode.appendChild(aNode);

                            rendered = tooltipNode.outerHTML;
                        }

                        return rendered;
                    }
                },
                {
                    data: 'defconfig_full',
                    title: 'Defconfig',
                    className: 'defconfig-column',
                    render: function(data, type, object) {
                        var aNode,
                            board,
                            job,
                            kernel,
                            rendered,
                            tooltipNode;

                        rendered = data;
                        if (type === 'display') {
                            board = object.board;
                            job = object.job;
                            kernel = object.kernel;

                            tooltipNode = html.tooltip();
                            tooltipNode.setAttribute(
                                'title',
                                'Boot reports for board&nbsp;' + board +
                                '&nbsp;with&nbsp;' + job +
                                '&nbsp;&dash;&nbsp;' + kernel +
                                '&nbsp;and&nbsp;' + data
                            );

                            aNode = document.createElement('a');
                            aNode.className = 'table-link';
                            aNode.setAttribute(
                                'href',
                                '/boot/' + board + '/job/' + job +
                                '/kernel/' + kernel + '/defconfig/' +
                                data + '/'
                            );

                            aNode.appendChild(document.createTextNode(data));
                            tooltipNode.appendChild(aNode);

                            rendered = tooltipNode.outerHTML;
                        }

                        return rendered;
                    }
                },
                {
                    data: 'created_on',
                    title: 'Date',
                    type: 'date',
                    className: 'date-column pull-center',
                    render: function(data, type) {
                        var created,
                            iNode,
                            rendered,
                            timeNode,
                            tooltipNode;

                        if (data === null) {
                            rendered = data;
                            if (type === 'display') {
                                tooltipNode = html.tooltip();
                                tooltipNode.setAttribute('Not available');

                                iNode = document.createElement('i');
                                iNode.className = 'fa fa-ban';

                                tooltipNode.appendChild(iNode);
                                rendered = tooltipNode.outerHTML;
                            }
                        } else {
                            created = new Date(data.$date);
                            if (type === 'display') {
                                timeNode = document.createElement('time');
                                timeNode.setAttribute(
                                    'datetime', created.toISOString());
                                timeNode.appendChild(
                                    document.createTextNode(
                                        created.toCustomISODate())
                                );
                                rendered = timeNode.outerHTML;
                            } else {
                                rendered = created;
                            }
                        }

                        return rendered;
                    }
                },
                {
                    data: 'status',
                    title: 'Status',
                    type: 'string',
                    className: 'pull-center',
                    render: function(data, type) {
                        var rendered,
                            tooltipNode;

                        rendered = data;
                        if (type === 'display') {
                            tooltipNode = html.tooltip();

                            switch (data) {
                                case 'PASS':
                                    tooltipNode.setAttribute(
                                        'title', 'Board booted successfully');
                                    tooltipNode.appendChild(html.success());
                                    break;
                                case 'FAIL':
                                    tooltipNode.setAttribute(
                                        'title', 'Board boot failed');
                                    tooltipNode.appendChild(html.fail());
                                    break;
                                case 'OFFLINE':
                                    tooltipNode.setAttribute(
                                        'title', 'Board offline');
                                    tooltipNode.appendChild(html.offline());
                                    break;
                                default:
                                    tooltipNode.setAttribute(
                                        'href', 'Board boot status unknown');
                                    tooltipNode.appendChild(html.unknown());
                                    break;
                            }

                            rendered = tooltipNode.outerHTML;
                        }

                        return rendered;
                    }
                },
                {
                    data: 'board',
                    title: '',
                    orderable: false,
                    searchable: false,
                    width: '30px',
                    className: 'pull-center',
                    render: function(data, type, object) {
                        var aNode,
                            iNode,
                            rendered,
                            tooltipNode,
                            defconfigFull,
                            kernel,
                            job,
                            lab;

                        rendered = null;
                        if (type === 'display') {
                            defconfigFull = object.defconfig_full;
                            job = object.job;
                            kernel = object.kernel;
                            lab = object.lab_name;

                            tooltipNode = html.tooltip();
                            tooltipNode.setAttribute(
                                'title',
                                'Details for board&nbsp;' + data +
                                '&nbsp;with tree&nbsp;' + job +
                                '&nbsp;&dash;&nbsp;' + kernel +
                                '&nbsp;and&nbsp;' + defconfigFull +
                                '&nbsp;(' + lab + ')'
                            );
                            aNode = document.createElement('a');
                            aNode.setAttribute(
                                'href',
                                '/boot/' + data + '/job/' + job +
                                '/kernel/' + kernel +
                                '/defconfig/' + defconfigFull +
                                '/lab/' + lab + '/?_id=' + object._id.$oid
                            );
                            iNode = document.createElement('i');
                            iNode.className = 'fa fa-search';

                            aNode.appendChild(iNode);
                            tooltipNode.appendChild(aNode);

                            rendered = tooltipNode.outerHTML;
                        }

                        return rendered;
                    }
                }
            ];

            rowURLFmt = '/boot/%(board)s/job/%(job)s/kernel/%(kernel)s' +
                '/defconfig/%(defconfig_full)s/lab/%(lab_name)s/';
            bootsTable
                .tableData(results)
                .columns(columns)
                .order([5, 'desc'])
                .menu('boot reports per page')
                .rowURL(rowURLFmt)
                .rowURLElements(
                    ['board', 'job', 'kernel', 'defconfig_full', 'lab_name'])
                .draw();

            bootsTable
                .pageLen(pageLen)
                .search(searchFilter);
        } else {
            html.removeElement(document.getElementById('table-loading'));
            html.replaceContent(
                document.getElementById('table-div'),
                html.errorDiv('No data found.'));
        }
    }

    function getBoots() {
        var data,
            deferred;

        data = {
            lab_name: labName,
            date_range: dateRange
        };

        deferred = r.get('/_ajax/boot', data);
        $.when(deferred)
            .fail(e.error, getBootsFail)
            .done(getBootsDone);
    }

    document.getElementById('li-boot').setAttribute('class', 'active');
    init.hotkeys();
    init.tooltip();

    if (document.getElementById('lab-name') !== null) {
        labName = document.getElementById('lab-name').value;
    }
    if (document.getElementById('date-range') !== null) {
        dateRange = document.getElementById('date-range').value;
    }
    if (document.getElementById('search-filter') !== null) {
        searchFilter = document.getElementById('search-filter').value;
    }
    if (document.getElementById('page-len') !== null) {
        pageLen = document.getElementById('page-len').value;
    }

    getBoots();
});