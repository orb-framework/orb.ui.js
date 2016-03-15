(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// define the namespaces
window.orb = window.orb || {};
window.orb.ui = window.orb.ui = new Backbone.Model({
    shiftKey: false,
    metaKey: false,
    altKey: false,
    ctrlKey: false
});

// include the UI components
require('./querybuilder/all');
require('./editor/all');
require('./modelpicker');
require('./table');

// create global registry
$(document).mousemove(function (event) {
    var $orb = $('.orb');
    if (event.shiftKey) {
        $orb.addClass('shift-pressed');
        orb.ui.set('shiftKey', true);
    } else {
        $orb.removeClass('shift-pressed');
        orb.ui.set('shiftKey', false);
    }
    
    if (event.metaKey) {
        $orb.addClass('meta-pressed');
        orb.ui.set('metaKey', true);
    } else {
        $orb.removeClass('meta-pressed');
        orb.ui.set('metaKey', false);
    }
    
    if (event.altKey) {
        $orb.addClass('alt-pressed');
        orb.ui.set('altKey', true);
    } else {
        $orb.removeClass('alt-pressed');
        orb.ui.set('altKey', false);
    }
    
    if (event.controlKey) {
        $orb.addClass('ctrl-pressed');
        orb.ui.set('ctrlKey', true);
    } else {
        $orb.removeClass('ctrl-pressed');
        orb.ui.set('ctrlKey', false);
    }
});
},{"./editor/all":2,"./modelpicker":4,"./querybuilder/all":5,"./table":9}],2:[function(require,module,exports){
require('./editor');
},{"./editor":3}],3:[function(require,module,exports){
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
},{}],4:[function(require,module,exports){
(function (orb) {
    orb.ui.ModelPicker = Marionette.ItemView.extend({
        tagName: 'select',
        attributes: {
            class: 'form-control input-sm selectpicker'
        },
        template: _.template(
            '<% _.each(scope, function (model) { %>' +
                '<% if (model.schema !== undefined) { %>' +
                    '<option value="<%- model.schema.model %>" <%- (model === modelType) ? "selected" : "" %>><%- model.schema.model %></option>' +
                '<% } %>' +
            '<% }) %>'
        ),
        events: {
            'change': 'update'
        },
        initialize: function (options) {
            options = options || {};
            this.referenceScope = options.scope;
            this.modelType = options.modelType;
        },
        templateHelpers: function () {
            return {
                scope: this.referenceScope,
                modelType: this.modelType
            };
        },
        update: function () {
            this.modelType = this.referenceScope[this.$el.val()];
            this.trigger('change');
        }
    });
})(window.orb);
},{}],5:[function(require,module,exports){
require('./querybuilder');
require('./editors');
require('./rules');
},{"./editors":6,"./querybuilder":7,"./rules":8}],6:[function(require,module,exports){
(function (orb) {
    orb.ui.QueryBuilder.Editors.InputField = Marionette.ItemView.extend({
        tagName: 'span',
        template: _.template(
            '<input id="edit" class="form-control input-sm input-block" value="<%- value %>" placeholder="<%- placeholder %>" type="text"/>'
        ),
        events: {
            'change input': 'updateValue'
        },
        initialize: function (options) {
            options = options || {};
            this.placeholder = options.placeholder;
        },
        templateHelpers: function () {
            return {placeholder: this.placeholder};
        },
        updateValue: function () {
            this.model.set('value', this.$('input').val());
        }
    });

    orb.ui.QueryBuilder.Editors.SelectField = Marionette.ItemView.extend({
        tagName: 'select',
        attributes: {
            class: 'form-control input-sm selectpicker'
        },
        template: _.template(
            '<% _.each(options, function (option) { %>' +
                '<option value="<%- option.value %>"><%- option.display %></option>' +
            '<% }); %>'
        ),
        events: {
            change: 'updateValue'
        },
        initialize: function (options) {
            this.options = options;
        },
        templateHelpers: function () {
            return this.options;
        },
        updateValue: function () {
            this.model.set('value', this.val());
        }
    });

    orb.ui.QueryBuilder.Editors.DateField = Marionette.ItemView.extend({
        tagName: 'span',
        template: _.template(
            '<input class="form-control input-sm" value="<%- value %>" type="date"/>'
        ),
        events: {
            'change input': 'updateValue'
        },
        updateValue: function () {
            this.model.set('value', this.$('input').val());
        }
    });

    orb.ui.QueryBuilder.Editors.BetweenField = Marionette.ItemView.extend({
        tagName: 'span',
        template: _.template(
            '<input class="form-control input-sm" value="<%- value %>" type="date"/>' +
            '<input class="form-control input-sm" value="<%- value %>" type="date"/>'
        )
    });
})(window.orb, window.Marionette);
},{}],7:[function(require,module,exports){
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
},{}],8:[function(require,module,exports){
(function (orb) {
    // define commonly reusable rules
    var null_inputs = {
        'is null': {
            op: orb.Q.Op.Is,
            value: null,
            matches: function (model) { return (model.get('op') === orb.Q.Op.Is && model.get('value') === null); }
        },
        'is not null': {
            op: orb.Q.Op.IsNot,
            value: null,
            matches: function (model) { return (model.get('op') === orb.Q.Op.IsNot && model.get('value') === null); }
        }
    };

    var basic_inputs = {
        'is': {
            op: orb.Q.Op.Is,
            editor: orb.ui.QueryBuilder.Editors.InputField
        },
        'is not': {
            op: orb.Q.Op.IsNot,
            editor: orb.ui.QueryBuilder.Editors.InputField
        }
    };

    var text_inputs = {
        'contains': {
            op: orb.Q.Op.Contains,
            editor: orb.ui.QueryBuilder.Editors.InputField
        },
        'does not contain': {
            op: orb.Q.Op.DoesNotContain,
            editor: orb.ui.QueryBuilder.Editors.InputField
        },
        'starts with': {
            op: orb.Q.Op.Startswith,
            editor: orb.ui.QueryBuilder.Editors.InputField
        },
        'does not start with': {
            op: orb.Q.Op.DoesNotStartwith,
            editor: orb.ui.QueryBuilder.Editors.InputField
        },
        'ends with': {
            op: orb.Q.Op.Startswith,
            editor: orb.ui.QueryBuilder.Editors.InputField
        },
        'does not end with': {
            op: orb.Q.Op.DoesNotEndwith,
            editor: orb.ui.QueryBuilder.Editors.InputField
        },
        'matches': {
            op: orb.Q.Op.Matches,
            editor: orb.ui.QueryBuilder.Editors.InputField
        },
        'does not match': {
            op: orb.Q.Op.DoesNotMatch,
            editor: orb.ui.QueryBuilder.Editors.InputField
        }
    };

    var bool_inputs = {
        'is': {
            op: orb.Q.Op.Is,
            editor: orb.ui.QueryBuilder.Editors.SelectField,
            options: {
                options: [{
                    value: 'true',
                    display: 'True'
                }, {
                    value: 'false',
                    display: 'False'
                }]
            }
        },
        'is not': {
            op: orb.Q.Op.Is,
            editor: orb.ui.QueryBuilder.Editors.SelectField,
            options: {
                options: [{
                    value: 'true',
                    display: 'True'
                }, {
                    value: 'false',
                    display: 'False'
                }]
            }
        }
    };

    var date_inputs = {
        'is': {
            op: orb.Q.Op.Is,
            editor: orb.ui.QueryBuilder.Editors.DateField
        },
        'is not': {
            op: orb.Q.Op.Is,
            editor: orb.ui.QueryBuilder.Editors.DateField
        },
        'after': {
            op: orb.Q.Op.After,
            editor: orb.ui.QueryBuilder.Editors.DateField
        },
        'before': {
            op: orb.Q.Op.Before,
            editor: orb.ui.QueryBuilder.Editors.DateField
        },
        'between': {
            op: orb.Q.Op.Between,
            editor: orb.ui.QueryBuilder.Editors.BetweenField
        }
    };
    
    var ref_inputs = {
        'is': {
            op: orb.Q.Op.Is,
            editor: orb.ui.QueryBuilder.Editors.InputField
        }
    };

    // define column specific rules
    orb.ui.QueryBuilder.Rules.Id = _.extend({}, basic_inputs, null_inputs);

    orb.ui.QueryBuilder.Rules.Boolean = _.extend({}, bool_inputs, null_inputs);

    orb.ui.QueryBuilder.Rules.String = _.extend({}, basic_inputs, null_inputs, text_inputs);
    orb.ui.QueryBuilder.Rules.Email = _.extend({}, basic_inputs, null_inputs, text_inputs);
    orb.ui.QueryBuilder.Rules.Text = _.extend({}, basic_inputs, null_inputs, text_inputs);
    orb.ui.QueryBuilder.Rules.Html = _.extend({}, basic_inputs, null_inputs, text_inputs);
    orb.ui.QueryBuilder.Rules.Xml = _.extend({}, basic_inputs, null_inputs, text_inputs);

    orb.ui.QueryBuilder.Rules.Date = _.extend({}, date_inputs);
    orb.ui.QueryBuilder.Rules.Datetime = _.extend({}, date_inputs);
    orb.ui.QueryBuilder.Rules.DatetimeWithTimezone = _.extend({}, date_inputs);
    
    orb.ui.QueryBuilder.Rules.Reference = _.extend({}, ref_inputs, null_inputs);

})(window.orb);
},{}],9:[function(require,module,exports){
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

},{}]},{},[1]);
