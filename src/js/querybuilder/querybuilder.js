(function (orb, Marionette, $) {
    orb.ui.QueryItem = Marionette.LayoutView.extend({
        tagName: 'li',
        model: orb.Query,
        attributes: {
            class: 'query-item'
        },
        template: _.template(
            '<div class="form-group item-content">' +
                '<div class="selector"></div>' +
                '<button class="btn btn-default action-btn btn-sm" data-action="removed">' +
                    '<strong>&times;</strong>' +
                '</button>' +
                '<span class="editor-area">' +
                    '<select id="column-ddl" class="form-control input-sm">' +
                        '<% _.each(schema.columns, function (col) { %>' +
                            '<option value="<%- col.field %>"><%- col.display %></option>' +
                        '<% }); %>' +
                    '</select>' +
                    '<select id="rule-ddl" class="form-control input-sm"></select>' +
                    '<span class="item-editor"></span>' +
                '</span>' +
                '<div class="btn-group switch-btn-group btn-group-sm pull-right">' +
                    '<div class="btn btn-default action-btn <%- (parent_op == "and") ? "selected" : "active" %>"' +
                            'data-action="switch" data-action-value="and" data-action-toggle="true">And</div>' +
                    '<div class="btn btn-default action-btn <%- (parent_op == "or") ? "selected" : "active" %>"' +
                            'data-action="switch" data-action-value="or" data-action-toggle="true">Or</div>' +
                '</div>' +
            '</div>'
        ),
        regions: {
            editor: '.item-editor'
        },
        events: {
            'change #column-ddl': 'loadRules',
            'change #rule-ddl': 'assignEditor',
            'click > .item-content .action-btn': 'triggerAction',
            'click .selector': 'toggleSelected'
        },
        assignEditor: function (event, options) {
            options = options || {};
            if (!options.column) {
                options.column = this.currentColumn();
            }

            var rules = orb.ui.QueryBuilder.Rules[options.column.type] || {};
            var rule = rules[this.$('#rule-ddl option:selected').text()] || {};
            if (rule.editor) {
                this.model.set('op', rule.op);
                this.editor.show(new rule.editor(_.extend({}, {model: this.model}, rule.options)));
            } else {
                this.$('.item-editor').empty();
                this.model.set('value', rule.value);
            }
        },
        currentColumn: function () {
            return this.schema.columns[this.$('#column-ddl').val()];
        },
        initialize: function (options) {
            var self = this;
            self.schema = options.schema;
            self.parentModel = options.parentModel;
        },
        onRender: function () {
            this.loadRules({}, {
                column: this.schema.columns[this.model.get('column')],
                op: this.model.get('op'),
                value: this.model.get('value')
            });
        },
        loadRules: function (event, options) {
            var self = this;

            options = options || {};
            if (!options.column) {
                options.column = this.currentColumn();
                this.model.set('column', options.column.field);
            } else {
                this.$('#column-ddl').val(options.column.field);
            }

            if (!options.op) {
                options.op = orb.Q.Op.Is;
            }

            var rules = orb.ui.QueryBuilder.Rules[options.column.type];
            var $ddl = this.$('#rule-ddl');
            $ddl.empty();
            _.each(rules, function (rule, display) {
                var selected = undefined;
                if (rule.matches) {
                    selected = rule.matches(self.model);
                } else {
                    selected = rule.op == options.op;
                }

                $ddl.append('<option "' + display + '" ' + (selected ? 'selected' : '') + '>' + display + '</option')
            });
            this.assignEditor({}, options);
        },
        toggleSelected: function (event) {
            this.$('.selector').toggleClass('selected');
        },
        triggerAction: function (event) {
            var $el = $(event.currentTarget);
            var action = $el.data('action');
            var value = $el.data('actionValue');
            var toggle = $el.data('actionToggle');

            if (toggle) {
                var $elems = this.$('[data-action="' + action + '"]');
                $elems.addClass('active');
                $el.removeClass('active');

                this.trigger('action:' + action, value);
            } else {
                this.trigger('action:' + action, value);
            }
        },
        templateHelpers: function () {
            var column_name = this.model.get('column') || _.keys(this.schema.columns)[0];
            var column = this.schema.columns[column_name];

            var helpers = {
                schema: this.schema,
                parent_op: this.parentModel.get('op')
            };
            return helpers;
        }
    });

    orb.ui.QueryCompoundItem = Marionette.LayoutView.extend({
        tagName: 'li',
        model: orb.QueryCompound,
        attributes: {
            class: 'query-item query-compound-item'
        },
        template: _.template(
            '<div class="form-group item-content">' +
                '<div class="selector"></div>' +
                '<button class="btn btn-default btn-sm action-btn" data-action="removed">' +
                    '<strong>&times;</strong>' +
                '</button>' +
                '<span class="editor-area">' +
                    '<em>' +
                        '<a href="#" class="text-muted toggle-link">' +
                            '<i class="fa fa-sm fa-caret-right"></i>&nbsp;&nbsp;' +
                            'Query Group' +
                        '</a>' +
                    '</em>' +
                '</span>' +
                '<div class="btn-group switch-btn-group btn-group-sm pull-right">' +
                    '<div class="btn btn-default action-btn <%- (parent_op == "and") ? "selected" : "active" %>"' +
                            'data-action="switch" data-action-value="and" data-action-toggle="true">And</div>' +
                    '<div class="btn btn-default action-btn <%- (parent_op == "or") ? "selected" : "active" %>"' +
                            'data-action="switch" data-action-value="or" data-action-toggle="true">Or</div>' +
                '</div>' +
            '</div>' +
            '<div id="sub-query-container" class="form-group"></div>'
        ),
        regions: {
            subQueryContainer: '#sub-query-container'
        },
        events: {
            'change #column-ddl': 'loadRules',
            'change #rule-ddl': 'assignEditor',
            'click > .item-content .action-btn': 'triggerAction',
            'click .selector': 'toggleSelected',
            'click > .item-content .toggle-link': 'toggleGroup'
        },
        initialize: function (options) {
            var self = this;
            self.expanded = false;
            self.schema = options.schema;
            self.parentModel = options.parentModel;
        },
        toggleGroup: function () {
            var self = this;
            var $toggle = this.$('> .item-content .toggle-link');
            var $icon = $toggle.find('i');
            if (this.expanded) {
                $icon.addClass('fa-caret-right');
                $icon.removeClass('fa-caret-down');

                this.subQueryContainer.empty();
            } else {
                $icon.removeClass('fa-caret-right');
                $icon.addClass('fa-caret-down');

                var builder = new orb.ui.QueryBuilder({
                    schema: self.schema,
                    model: self.model,
                    nested: true
                });

                this.subQueryContainer.show(builder);
            }
            this.expanded = !this.expanded;
        },
        templateHelpers: function () {
            var column_name = this.model.column || _.keys(this.schema.columns)[0];
            var column = this.schema.columns[column_name];

            var helpers = {
                schema: this.schema,
                rules: orb.ui.QueryBuilder.Rules[column.type],
                parent_op: this.parentModel.get('op')
            };
            return helpers;
        },
        triggerAction: function (event) {
            var $el = $(event.currentTarget);
            var action = $el.data('action');
            var value = $el.data('actionValue');
            var toggle = $el.data('actionToggle');

            if (toggle) {
                var $elems = this.$('> item-content [data-action="' + action + '"]');
                $elems.addClass('active');
                $el.removeClass('active');

                this.trigger('action:' + action, value);
            } else {
                this.trigger('action:' + action, value);
            }
        }
    });

    orb.ui.QueryBuilder = Marionette.CompositeView.extend({
        tagName: 'div',
        attributes: {
            class: 'querybuilder form form-inline',
            role: 'form'
        },
        childView: function (item) {
            if (item.model instanceof orb.Q) {
                return new orb.ui.QueryItem(item);
            } else {
                return new orb.ui.QueryCompoundItem(item);
            }
        },
        childViewContainer: '.query-items',
        childViewOptions: function () {
            return {
                schema: this.schema,
                parentModel: this.model
            };
        },
        childEvents: {
            'action:switch': 'switchOp',
            'action:removed': 'removeQuery'
        },
        template: _.template(
            '<ul class="list-unstyled query-items"></ul>' +
            '<% if (!nested) { %>' +
            '<div class="help">' +
                '<small class="text-muted"><em>Hold ctrl or meta key to select and group queries.</em></small>' +
            '</div>' +
            '<% } %>'
        ),
        initialize: function (options) {
            var self = this;
            options = options || {};

            if (options.modelType) {
                this.schema = options.modelType.schema;
            } else {
                this.schema = options.schema;
            }

            if (!this.model) {
                this.model = new orb.QCompound();
            }


            this.modelType = options.modelType || undefined;
            this.nested = options.nested;
            this.collection = options.collection || this.model.queries;

            if (this.collection.isEmpty()) {
                this.collection.add(new orb.Q());
            }

            self.listenTo(orb.ui, 'change:metaKey', function (event, state) {
                if (!state) {
                    var $group = self.$('> .query-items > .query-item > .item-content .selector.selected');
                    $group.removeClass('selected');

                    // extract these queries from this model and insert them into a new group query
                    var queries = [];

                    // extract the queries that are going to be grouped together
                    $group.each(function (i, selector) {
                        var $item = $(selector).closest('li');
                        var query = self.collection.at($item.index());
                        queries.push(query);
                    });

                    if (queries.length > 1) {
                        // create the new group
                        var new_group = new orb.QCompound({
                            op: self.model.get('op'),
                            queries: new Backbone.Collection(queries)
                        });

                        // remove the queries from this model
                        this.model.queries.remove(queries);
                        this.model.queries.add(new_group);
                    }
                }
            });
        },
        removeQuery: function (query) {
            if (this.collection.length > 1) {
                this.collection.remove(query.model);
            }
        },
        switchOp: function (event, op) {
            if (this.model.get('op') !== op) {
                this.model.set('op', op);
                if (this.collection.length === 1) {
                    this.collection.add(new orb.Q());
                }
            } else {
                this.collection.add(new orb.Q());
            }

            // update child items
            this.$('> .query-items > .query-item > .item-content .action-btn[data-action="switch"]').each(function (i, item) {
                var $item = $(item);
                if ($item.data('action-value') === op) {
                    $item.removeClass('active').addClass('selected');
                } else {
                    $item.removeClass('selected').addClass('active');
                }
            });
        },
        templateHelpers: function () {
            return {
                nested: this.nested
            };
        }
    }, {
        Editors: {},
        Rules: {}
    });


})(window.orb, window.Marionette, $);