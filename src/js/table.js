(function (orb) {
    orb.ui.Table = Marionette.ItemView.extend({
        tagName: 'div',
        attributes: {
            class: 'table table-striped orb-table'
        },
        template: _.template(
            '<table class="table table-striped">' +
                '<% if (showHeader) { %>' +
                    '<thead>' +
                        '<tr>' +
                            '<% _.each(columns, function (column) { %>' +
                                '<th><%= column.display %></th>' +
                            '<% }); %>' +
                        '</tr>' +
                    '</thead>' +
                '<% } %>' +
                '<% if (showFooter) { %>' +
                    '<tfoot>' +
                        '<tr>' +
                            '<% _.each(columns, function (column) { %>' +
                                '<th><%= column.display %></th>' +
                            '<% }); %>' +
                        '</tr>' +
                    '</tfoot>' +
                '<% } %>' +
                '<tbody></tbody>' +
            '</table>'
        ),
        collectData: function () {
            var output = [];
            this.collection.each(function (model) {
                output.push(model.attributes);
            });
            return output;
        },
        getColumns: function () {
            var output = [];
            if (this.schema) {
                _.each(this.schema.columns, function (column) {
                    output.push({
                        data: column.field,
                        display: column.display
                    });
                });
            }
            return output;
        },
        getColumnDefs: function (columns) {
            var defs = [];
            var self = this;
            _.each(columns, function (col, index) {
                if (col.renderer) {
                    var renderer = col.renderer;
                    var dataName = col.data;
                    var rendererOptions = col.rendererOptions;

                    defs.push({
                        targets: index,
                        data: dataName,
                        render: function (data, type, full, meta) {
                            if (type === 'display') {
                                var widget = self[renderer](data, type, full, meta, rendererOptions);

                                if (typeof(widget) === 'string') {
                                    return widget;
                                } else {
                                    var id = dataName + '_' + meta.row;
                                    self.renderers[id] = widget;
                                    return '<span id="' + id + '" class="renderer-container waiting"></span>'
                                }

                            } else {
                                return data;
                            }
                        }
                    });
                }
            });
            return defs;
        },
        getExportData: function (record, field) {
            return record.attributes[field];
        },
        initialize: function (options) {
            options = options || {};

            if (options.collection) {
                this.collection = options.collection;
                this.modelType = this.collection.model;
                this.schema = this.modelType.schema;
            }
            else if (options.modelType) {
                this.modelType = options.modelType;
                this.schema = this.modelType.schema;
                this.collection = options.modelType.all();
            } else {
                throw 'Invalid properties to Table';
            }

            // define properties
            this.table = undefined;
            this.renderers = {};

            // define context options
            this.columns = options.columns || this.getColumns();
            this.columnFilter = options.columnFilter || undefined;

            // define default options
            this.paginate = (options.paginate === undefined) ? true : options.paginate;
            this.sort = (options.sort === undefined) ? true : options.sort;
            this.filter = options.filter || true;
            this.rowHeight = options.rowHeight || 60;
            this.maxVisibleRows = options.maxVisibleRows || 10;
            this.maxHeight = options.maxHeight || (this.rowHeight * this.maxVisibleRows);
            this.showHeader = options.showHeader || true;
            this.showFooter = options.showFooter || false;
            this.options = options.options || {};

        },
        onRowRender: function (row, data, index) {
            var self = this;
            $(row).find('.renderer-container.waiting').each(function () {
                var $holder = $(this);
                $holder.removeClass('waiting');

                var renderer = self.renderers[$holder.attr('id')];

                // add a jquery object directly
                if (renderer instanceof jQuery) {
                    $holder.append(renderer);
                }

                // render a backbone view
                else {
                    renderer.render();
                    $holder.append(renderer.$el);
                }
            });
        },
        onLoad: function () {
            // virtual method
        },
        onRender: function () {
            var self = this;

            // set the default loader for this table to load collection information
            var options = {
                // scrolling options
                scrollY: this.maxHeight,
                scrollX: true,
                scrollCollapse: true,
                stateSave: true,
                processing: true,
                lengthChange: true,
                filter: this.filter,
                info: true,

                deferRender: true,
                scroller: {
                    rowHeight: this.rowHeight,
                    displayBuffer: 2
                },

                // schema information
                columns: this.columns,
                columnDefs: this.columnDefs,

                paginate: this.paginate,
                sort: this.sort,

                dom: 'ZTrtiS',

                rowCallback: function (row, data, index) {
                    return self.onRowRender(row, data, index);
                },
                //drawCallback: function (settings) {
                //    var api = this.api();
                //    var rows = api.rows({page: 'current'}).nodes();
                //    var last = null;
                //
                //    api.column(1, {page: 'current'}).data().each(function (group, i) {
                //        if (last !== group) {
                //            $(rows).eq(i).before(
                //                '<tr class="group"><td colspan="' + self.columns.length + '">' + group + '</td></tr>'
                //            );
                //            last = group;
                //        }
                //    });
                //},
                ajax: function (data, callback, settings) {
                    var start = Date.now();
                    return self.collection.fetch({
                        success: function (collection) {
                            var finished = Date.now();
                            console.log('Query took ' + (finished - start) + 'ms');
                            callback({data: self.collectData()});
                            self.onLoad();
                        }
                    });
                }
            };

            var $table = this.$('table');

            this.table = $table.DataTable(_.extend(options, self.options));
        },
        refresh: function () {
            this.table.ajax.reload();
        },
        rowCount: function () {
            var info = this.table.page.info();
            return info.recordsTotal;
        },
        search: function (text) {
            this.table.search(text);
        },
        unfilteredRowCount: function () {
            var info = this.table.page.info();
            return info.recordsDisplay;
        },
        templateHelpers: function () {
            return {
                columns: this.columns,
                showHeader: this.showHeader,
                showFooter: this.showFooter
            };
        }
    });
})(window.orb);
