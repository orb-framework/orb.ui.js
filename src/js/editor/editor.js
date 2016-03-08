(function (orb) {
    orb.ui.Toolbar = Marionette.LayoutView.extend({
        tagName: 'div',
        attributes: {
            class: 'orb-toolbar form form-inline',
            role: 'form'
        },
        template: _.template(
            '<div id="picker-container" class="form-group"></div>' +
            '<div class="form-group">' +
                '<input class="form-control input-sm" placeholder="quick search..."/>' +
            '</div>' +
            '<span class="pull-right">' +
                '<div class="form-group">' +
                    '<div class="btn-group btn-group-sm">' +
                        '<button id="add-btn" class="btn btn-default">' +
                            '<i class="fa fa-plus"></i>' +
                        '</button>' +
                        '<button id="edit-btn" class="btn btn-default">' +
                            '<i class="fa fa-edit"></i>' +
                        '</button>' +
                        '<button id="remove-btn" class="btn btn-default">' +
                            '<i class="fa fa-remove"></i>' +
                        '</button>' +
                    '</div>' +
                '</div>' +
                '&nbsp;' +
                '<div class="form-group">' +
                    '<div class="btn-group btn-group-sm">' +
                        '<button id="config-btn" class="btn btn-default">' +
                            '<i class="fa fa-gear"></i>' +
                        '</button>' +
                    '</div>' +
                '</div>' +
            '</span>'
        ),
        regions: {
            pickerContainer: '#picker-container'
        },
        events: {
            'click #config-btn': 'configure'
        },
        configure: function (event) {
            event.preventDefault();
            event.stopPropagation();

            if (!this.queryBuilder) {
                this.query = new orb.QCompound();
                this.queryBuilder = new orb.ui.QueryBuilder({
                    modelType: this.modelType,
                    collection: this.query.queries
                });

                var template = '' +
                    '<div class="popover orb-query-popover" style="min-width:800px;max-width:800px" role="tooltip">' +
                        '<div class="arrow"></div>' +
                        '<h3 class="popover-title"></h3>' +
                        '<div class="popover-content"></div>' +
                    '</div>';

                this.queryBuilder.render();
                this.$('#config-btn').popover({
                    trigger: 'manual',
                    content: this.queryBuilder.$el,
                    html: true,
                    placement: 'left',
                    container: 'body',
                    template: template
                });
                this.$('#config-btn').popover('show');
                this.queryBuilderVisible = true;
            } else if (this.queryBuilderVisible) {
                this.rebuild();
                this.$('#config-btn').popover('hide');
                this.queryBuilderVisible = false;
            } else {
                this.$('#config-btn').popover('show');
                this.queryBuilderVisible = true;
            }
        },
        initialize: function (options) {
            options = options || {};

            this.modelType = options.modelType;
            this.collection = options.collection;
        },
        onRender: function () {
            this.picker = new orb.ui.ModelPicker({
                scope: this.modelType.schema.referenceScope,
                modelType: this.modelType
            });
            
            this.pickerContainer.show(this.picker);

            var self = this;
            this.listenTo(this.picker, 'change', function () {
                if (self.queryBuilder) {
                    self.queryBuilder.destroy();
                    self.queryBuilder = undefined;
                    self.query = undefined;
                    self.queryBuilderVisible = false;
                    self.$('#config-btn').popover('destroy');
                }
                self.rebuild();
            });
        },
        rebuild: function () {
            this.modelType = this.picker.modelType;
            this.collection = this.modelType.select({where: this.query});

            this.trigger('change');
        }
    });

    orb.ui.Editor = Marionette.LayoutView.extend({
        tagName: 'div',
        attributes: {
            class: 'orb-editor container-fluid'
        },
        template: _.template(
            '<div id="toolbar-container" class="col-md-12"></div>' +
            '<div id="table-container" class="col-md-12"></div>'
        ),
        regions: {
            toolbarContainer: '#toolbar-container',
            tableContainer: '#table-container'
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
        },
        onRender: function () {
            this.toolbar = new orb.ui.Toolbar({
                modelType: this.modelType,
                collection: this.collection
            });
            this.toolbarContainer.show(this.toolbar);

            this.tableContainer.show(new orb.ui.Table({
                filter: false,
                collection: this.collection
            }));

            // create connections
            var self = this;
            this.listenTo(this.toolbar, 'change', function () {
                self.rebuild();
            });
        },
        rebuild: function () {
            this.tableContainer.show(new orb.ui.Table({
                filter: false,
                collection: this.toolbar.collection
            }));
        }
    });
})(window.orb);