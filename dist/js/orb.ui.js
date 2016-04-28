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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvYWxsLmpzIiwic3JjL2pzL2VkaXRvci9hbGwuanMiLCJzcmMvanMvZWRpdG9yL2VkaXRvci5qcyIsInNyYy9qcy9tb2RlbHBpY2tlci5qcyIsInNyYy9qcy9xdWVyeWJ1aWxkZXIvYWxsLmpzIiwic3JjL2pzL3F1ZXJ5YnVpbGRlci9lZGl0b3JzLmpzIiwic3JjL2pzL3F1ZXJ5YnVpbGRlci9xdWVyeWJ1aWxkZXIuanMiLCJzcmMvanMvcXVlcnlidWlsZGVyL3J1bGVzLmpzIiwic3JjL2pzL3RhYmxlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNVZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIGRlZmluZSB0aGUgbmFtZXNwYWNlc1xud2luZG93Lm9yYiA9IHdpbmRvdy5vcmIgfHwge307XG53aW5kb3cub3JiLnVpID0gd2luZG93Lm9yYi51aSA9IG5ldyBCYWNrYm9uZS5Nb2RlbCh7XG4gICAgc2hpZnRLZXk6IGZhbHNlLFxuICAgIG1ldGFLZXk6IGZhbHNlLFxuICAgIGFsdEtleTogZmFsc2UsXG4gICAgY3RybEtleTogZmFsc2Vcbn0pO1xuXG4vLyBpbmNsdWRlIHRoZSBVSSBjb21wb25lbnRzXG5yZXF1aXJlKCcuL3F1ZXJ5YnVpbGRlci9hbGwnKTtcbnJlcXVpcmUoJy4vZWRpdG9yL2FsbCcpO1xucmVxdWlyZSgnLi9tb2RlbHBpY2tlcicpO1xucmVxdWlyZSgnLi90YWJsZScpO1xuXG4vLyBjcmVhdGUgZ2xvYmFsIHJlZ2lzdHJ5XG4kKGRvY3VtZW50KS5tb3VzZW1vdmUoZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgdmFyICRvcmIgPSAkKCcub3JiJyk7XG4gICAgaWYgKGV2ZW50LnNoaWZ0S2V5KSB7XG4gICAgICAgICRvcmIuYWRkQ2xhc3MoJ3NoaWZ0LXByZXNzZWQnKTtcbiAgICAgICAgb3JiLnVpLnNldCgnc2hpZnRLZXknLCB0cnVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAkb3JiLnJlbW92ZUNsYXNzKCdzaGlmdC1wcmVzc2VkJyk7XG4gICAgICAgIG9yYi51aS5zZXQoJ3NoaWZ0S2V5JywgZmFsc2UpO1xuICAgIH1cbiAgICBcbiAgICBpZiAoZXZlbnQubWV0YUtleSkge1xuICAgICAgICAkb3JiLmFkZENsYXNzKCdtZXRhLXByZXNzZWQnKTtcbiAgICAgICAgb3JiLnVpLnNldCgnbWV0YUtleScsIHRydWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgICRvcmIucmVtb3ZlQ2xhc3MoJ21ldGEtcHJlc3NlZCcpO1xuICAgICAgICBvcmIudWkuc2V0KCdtZXRhS2V5JywgZmFsc2UpO1xuICAgIH1cbiAgICBcbiAgICBpZiAoZXZlbnQuYWx0S2V5KSB7XG4gICAgICAgICRvcmIuYWRkQ2xhc3MoJ2FsdC1wcmVzc2VkJyk7XG4gICAgICAgIG9yYi51aS5zZXQoJ2FsdEtleScsIHRydWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgICRvcmIucmVtb3ZlQ2xhc3MoJ2FsdC1wcmVzc2VkJyk7XG4gICAgICAgIG9yYi51aS5zZXQoJ2FsdEtleScsIGZhbHNlKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKGV2ZW50LmNvbnRyb2xLZXkpIHtcbiAgICAgICAgJG9yYi5hZGRDbGFzcygnY3RybC1wcmVzc2VkJyk7XG4gICAgICAgIG9yYi51aS5zZXQoJ2N0cmxLZXknLCB0cnVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAkb3JiLnJlbW92ZUNsYXNzKCdjdHJsLXByZXNzZWQnKTtcbiAgICAgICAgb3JiLnVpLnNldCgnY3RybEtleScsIGZhbHNlKTtcbiAgICB9XG59KTsiLCJyZXF1aXJlKCcuL2VkaXRvcicpOyIsIihmdW5jdGlvbiAob3JiKSB7XG4gICAgb3JiLnVpLlRvb2xiYXIgPSBNYXJpb25ldHRlLkxheW91dFZpZXcuZXh0ZW5kKHtcbiAgICAgICAgdGFnTmFtZTogJ2RpdicsXG4gICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgIGNsYXNzOiAnb3JiLXRvb2xiYXIgZm9ybSBmb3JtLWlubGluZScsXG4gICAgICAgICAgICByb2xlOiAnZm9ybSdcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IF8udGVtcGxhdGUoXG4gICAgICAgICAgICAnPGRpdiBpZD1cInBpY2tlci1jb250YWluZXJcIiBjbGFzcz1cImZvcm0tZ3JvdXBcIj48L2Rpdj4nICtcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiZm9ybS1ncm91cFwiPicgK1xuICAgICAgICAgICAgICAgICc8aW5wdXQgY2xhc3M9XCJmb3JtLWNvbnRyb2wgaW5wdXQtc21cIiBwbGFjZWhvbGRlcj1cInF1aWNrIHNlYXJjaC4uLlwiLz4nICtcbiAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cInB1bGwtcmlnaHRcIj4nICtcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImZvcm0tZ3JvdXBcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJidG4tZ3JvdXAgYnRuLWdyb3VwLXNtXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGJ1dHRvbiBpZD1cImFkZC1idG5cIiBjbGFzcz1cImJ0biBidG4tZGVmYXVsdFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8aSBjbGFzcz1cImZhIGZhLXBsdXNcIj48L2k+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9idXR0b24+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGJ1dHRvbiBpZD1cImVkaXQtYnRuXCIgY2xhc3M9XCJidG4gYnRuLWRlZmF1bHRcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPGkgY2xhc3M9XCJmYSBmYS1lZGl0XCI+PC9pPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzwvYnV0dG9uPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxidXR0b24gaWQ9XCJyZW1vdmUtYnRuXCIgY2xhc3M9XCJidG4gYnRuLWRlZmF1bHRcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPGkgY2xhc3M9XCJmYSBmYS1yZW1vdmVcIj48L2k+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9idXR0b24+JyArXG4gICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJyZuYnNwOycgK1xuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiZm9ybS1ncm91cFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImJ0bi1ncm91cCBidG4tZ3JvdXAtc21cIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8YnV0dG9uIGlkPVwiY29uZmlnLWJ0blwiIGNsYXNzPVwiYnRuIGJ0bi1kZWZhdWx0XCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxpIGNsYXNzPVwiZmEgZmEtZ2VhclwiPjwvaT4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8L2J1dHRvbj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICc8L3NwYW4+J1xuICAgICAgICApLFxuICAgICAgICByZWdpb25zOiB7XG4gICAgICAgICAgICBwaWNrZXJDb250YWluZXI6ICcjcGlja2VyLWNvbnRhaW5lcidcbiAgICAgICAgfSxcbiAgICAgICAgZXZlbnRzOiB7XG4gICAgICAgICAgICAnY2xpY2sgI2NvbmZpZy1idG4nOiAnY29uZmlndXJlJ1xuICAgICAgICB9LFxuICAgICAgICBjb25maWd1cmU6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICAgICAgICBpZiAoIXRoaXMucXVlcnlCdWlsZGVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5xdWVyeSA9IG5ldyBvcmIuUUNvbXBvdW5kKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5xdWVyeUJ1aWxkZXIgPSBuZXcgb3JiLnVpLlF1ZXJ5QnVpbGRlcih7XG4gICAgICAgICAgICAgICAgICAgIG1vZGVsVHlwZTogdGhpcy5tb2RlbFR5cGUsXG4gICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb246IHRoaXMucXVlcnkucXVlcmllc1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgdmFyIHRlbXBsYXRlID0gJycgK1xuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cInBvcG92ZXIgb3JiLXF1ZXJ5LXBvcG92ZXJcIiBzdHlsZT1cIm1pbi13aWR0aDo4MDBweDttYXgtd2lkdGg6ODAwcHhcIiByb2xlPVwidG9vbHRpcFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJhcnJvd1wiPjwvZGl2PicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxoMyBjbGFzcz1cInBvcG92ZXItdGl0bGVcIj48L2gzPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJwb3BvdmVyLWNvbnRlbnRcIj48L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzwvZGl2Pic7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnF1ZXJ5QnVpbGRlci5yZW5kZXIoKTtcbiAgICAgICAgICAgICAgICB0aGlzLiQoJyNjb25maWctYnRuJykucG9wb3Zlcih7XG4gICAgICAgICAgICAgICAgICAgIHRyaWdnZXI6ICdtYW51YWwnLFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50OiB0aGlzLnF1ZXJ5QnVpbGRlci4kZWwsXG4gICAgICAgICAgICAgICAgICAgIGh0bWw6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHBsYWNlbWVudDogJ2xlZnQnLFxuICAgICAgICAgICAgICAgICAgICBjb250YWluZXI6ICdib2R5JyxcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGU6IHRlbXBsYXRlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy4kKCcjY29uZmlnLWJ0bicpLnBvcG92ZXIoJ3Nob3cnKTtcbiAgICAgICAgICAgICAgICB0aGlzLnF1ZXJ5QnVpbGRlclZpc2libGUgPSB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnF1ZXJ5QnVpbGRlclZpc2libGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlYnVpbGQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLiQoJyNjb25maWctYnRuJykucG9wb3ZlcignaGlkZScpO1xuICAgICAgICAgICAgICAgIHRoaXMucXVlcnlCdWlsZGVyVmlzaWJsZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLiQoJyNjb25maWctYnRuJykucG9wb3Zlcignc2hvdycpO1xuICAgICAgICAgICAgICAgIHRoaXMucXVlcnlCdWlsZGVyVmlzaWJsZSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICAgICAgdGhpcy5tb2RlbFR5cGUgPSBvcHRpb25zLm1vZGVsVHlwZTtcbiAgICAgICAgICAgIHRoaXMuY29sbGVjdGlvbiA9IG9wdGlvbnMuY29sbGVjdGlvbjtcbiAgICAgICAgfSxcbiAgICAgICAgb25SZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMucGlja2VyID0gbmV3IG9yYi51aS5Nb2RlbFBpY2tlcih7XG4gICAgICAgICAgICAgICAgc2NvcGU6IHRoaXMubW9kZWxUeXBlLnNjaGVtYS5yZWZlcmVuY2VTY29wZSxcbiAgICAgICAgICAgICAgICBtb2RlbFR5cGU6IHRoaXMubW9kZWxUeXBlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5waWNrZXJDb250YWluZXIuc2hvdyh0aGlzLnBpY2tlcik7XG5cbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5waWNrZXIsICdjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYucXVlcnlCdWlsZGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYucXVlcnlCdWlsZGVyLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5xdWVyeUJ1aWxkZXIgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYucXVlcnkgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYucXVlcnlCdWlsZGVyVmlzaWJsZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLiQoJyNjb25maWctYnRuJykucG9wb3ZlcignZGVzdHJveScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZWxmLnJlYnVpbGQoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICByZWJ1aWxkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLm1vZGVsVHlwZSA9IHRoaXMucGlja2VyLm1vZGVsVHlwZTtcbiAgICAgICAgICAgIHRoaXMuY29sbGVjdGlvbiA9IHRoaXMubW9kZWxUeXBlLnNlbGVjdCh7d2hlcmU6IHRoaXMucXVlcnl9KTtcblxuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKCdjaGFuZ2UnKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgb3JiLnVpLkVkaXRvciA9IE1hcmlvbmV0dGUuTGF5b3V0Vmlldy5leHRlbmQoe1xuICAgICAgICB0YWdOYW1lOiAnZGl2JyxcbiAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgY2xhc3M6ICdvcmItZWRpdG9yIGNvbnRhaW5lci1mbHVpZCdcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IF8udGVtcGxhdGUoXG4gICAgICAgICAgICAnPGRpdiBpZD1cInRvb2xiYXItY29udGFpbmVyXCIgY2xhc3M9XCJjb2wtbWQtMTJcIj48L2Rpdj4nICtcbiAgICAgICAgICAgICc8ZGl2IGlkPVwidGFibGUtY29udGFpbmVyXCIgY2xhc3M9XCJjb2wtbWQtMTJcIj48L2Rpdj4nXG4gICAgICAgICksXG4gICAgICAgIHJlZ2lvbnM6IHtcbiAgICAgICAgICAgIHRvb2xiYXJDb250YWluZXI6ICcjdG9vbGJhci1jb250YWluZXInLFxuICAgICAgICAgICAgdGFibGVDb250YWluZXI6ICcjdGFibGUtY29udGFpbmVyJ1xuICAgICAgICB9LFxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5jb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb2xsZWN0aW9uID0gb3B0aW9ucy5jb2xsZWN0aW9uO1xuICAgICAgICAgICAgICAgIHRoaXMubW9kZWxUeXBlID0gdGhpcy5jb2xsZWN0aW9uLm1vZGVsO1xuICAgICAgICAgICAgICAgIHRoaXMuc2NoZW1hID0gdGhpcy5tb2RlbFR5cGUuc2NoZW1hO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAob3B0aW9ucy5tb2RlbFR5cGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1vZGVsVHlwZSA9IG9wdGlvbnMubW9kZWxUeXBlO1xuICAgICAgICAgICAgICAgIHRoaXMuc2NoZW1hID0gdGhpcy5tb2RlbFR5cGUuc2NoZW1hO1xuICAgICAgICAgICAgICAgIHRoaXMuY29sbGVjdGlvbiA9IG9wdGlvbnMubW9kZWxUeXBlLmFsbCgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnSW52YWxpZCBwcm9wZXJ0aWVzIHRvIFRhYmxlJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgb25SZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMudG9vbGJhciA9IG5ldyBvcmIudWkuVG9vbGJhcih7XG4gICAgICAgICAgICAgICAgbW9kZWxUeXBlOiB0aGlzLm1vZGVsVHlwZSxcbiAgICAgICAgICAgICAgICBjb2xsZWN0aW9uOiB0aGlzLmNvbGxlY3Rpb25cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy50b29sYmFyQ29udGFpbmVyLnNob3codGhpcy50b29sYmFyKTtcblxuICAgICAgICAgICAgdGhpcy50YWJsZUNvbnRhaW5lci5zaG93KG5ldyBvcmIudWkuVGFibGUoe1xuICAgICAgICAgICAgICAgIGZpbHRlcjogZmFsc2UsXG4gICAgICAgICAgICAgICAgY29sbGVjdGlvbjogdGhpcy5jb2xsZWN0aW9uXG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgIC8vIGNyZWF0ZSBjb25uZWN0aW9uc1xuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5Ubyh0aGlzLnRvb2xiYXIsICdjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5yZWJ1aWxkKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgcmVidWlsZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy50YWJsZUNvbnRhaW5lci5zaG93KG5ldyBvcmIudWkuVGFibGUoe1xuICAgICAgICAgICAgICAgIGZpbHRlcjogZmFsc2UsXG4gICAgICAgICAgICAgICAgY29sbGVjdGlvbjogdGhpcy50b29sYmFyLmNvbGxlY3Rpb25cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgIH0pO1xufSkod2luZG93Lm9yYik7IiwiKGZ1bmN0aW9uIChvcmIpIHtcbiAgICBvcmIudWkuTW9kZWxQaWNrZXIgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCh7XG4gICAgICAgIHRhZ05hbWU6ICdzZWxlY3QnLFxuICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICBjbGFzczogJ2Zvcm0tY29udHJvbCBpbnB1dC1zbSBzZWxlY3RwaWNrZXInXG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiBfLnRlbXBsYXRlKFxuICAgICAgICAgICAgJzwlIF8uZWFjaChzY29wZSwgZnVuY3Rpb24gKG1vZGVsKSB7ICU+JyArXG4gICAgICAgICAgICAgICAgJzwlIGlmIChtb2RlbC5zY2hlbWEgIT09IHVuZGVmaW5lZCkgeyAlPicgK1xuICAgICAgICAgICAgICAgICAgICAnPG9wdGlvbiB2YWx1ZT1cIjwlLSBtb2RlbC5zY2hlbWEubW9kZWwgJT5cIiA8JS0gKG1vZGVsID09PSBtb2RlbFR5cGUpID8gXCJzZWxlY3RlZFwiIDogXCJcIiAlPj48JS0gbW9kZWwuc2NoZW1hLm1vZGVsICU+PC9vcHRpb24+JyArXG4gICAgICAgICAgICAgICAgJzwlIH0gJT4nICtcbiAgICAgICAgICAgICc8JSB9KSAlPidcbiAgICAgICAgKSxcbiAgICAgICAgZXZlbnRzOiB7XG4gICAgICAgICAgICAnY2hhbmdlJzogJ3VwZGF0ZSdcbiAgICAgICAgfSxcbiAgICAgICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICAgICAgdGhpcy5yZWZlcmVuY2VTY29wZSA9IG9wdGlvbnMuc2NvcGU7XG4gICAgICAgICAgICB0aGlzLm1vZGVsVHlwZSA9IG9wdGlvbnMubW9kZWxUeXBlO1xuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZUhlbHBlcnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc2NvcGU6IHRoaXMucmVmZXJlbmNlU2NvcGUsXG4gICAgICAgICAgICAgICAgbW9kZWxUeXBlOiB0aGlzLm1vZGVsVHlwZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgdXBkYXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLm1vZGVsVHlwZSA9IHRoaXMucmVmZXJlbmNlU2NvcGVbdGhpcy4kZWwudmFsKCldO1xuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKCdjaGFuZ2UnKTtcbiAgICAgICAgfVxuICAgIH0pO1xufSkod2luZG93Lm9yYik7IiwicmVxdWlyZSgnLi9xdWVyeWJ1aWxkZXInKTtcbnJlcXVpcmUoJy4vZWRpdG9ycycpO1xucmVxdWlyZSgnLi9ydWxlcycpOyIsIihmdW5jdGlvbiAob3JiKSB7XG4gICAgb3JiLnVpLlF1ZXJ5QnVpbGRlci5FZGl0b3JzLklucHV0RmllbGQgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCh7XG4gICAgICAgIHRhZ05hbWU6ICdzcGFuJyxcbiAgICAgICAgdGVtcGxhdGU6IF8udGVtcGxhdGUoXG4gICAgICAgICAgICAnPGlucHV0IGlkPVwiZWRpdFwiIGNsYXNzPVwiZm9ybS1jb250cm9sIGlucHV0LXNtIGlucHV0LWJsb2NrXCIgdmFsdWU9XCI8JS0gdmFsdWUgJT5cIiBwbGFjZWhvbGRlcj1cIjwlLSBwbGFjZWhvbGRlciAlPlwiIHR5cGU9XCJ0ZXh0XCIvPidcbiAgICAgICAgKSxcbiAgICAgICAgZXZlbnRzOiB7XG4gICAgICAgICAgICAnY2hhbmdlIGlucHV0JzogJ3VwZGF0ZVZhbHVlJ1xuICAgICAgICB9LFxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgICAgICB0aGlzLnBsYWNlaG9sZGVyID0gb3B0aW9ucy5wbGFjZWhvbGRlcjtcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGVIZWxwZXJzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4ge3BsYWNlaG9sZGVyOiB0aGlzLnBsYWNlaG9sZGVyfTtcbiAgICAgICAgfSxcbiAgICAgICAgdXBkYXRlVmFsdWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMubW9kZWwuc2V0KCd2YWx1ZScsIHRoaXMuJCgnaW5wdXQnKS52YWwoKSk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIG9yYi51aS5RdWVyeUJ1aWxkZXIuRWRpdG9ycy5TZWxlY3RGaWVsZCA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcbiAgICAgICAgdGFnTmFtZTogJ3NlbGVjdCcsXG4gICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgIGNsYXNzOiAnZm9ybS1jb250cm9sIGlucHV0LXNtIHNlbGVjdHBpY2tlcidcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IF8udGVtcGxhdGUoXG4gICAgICAgICAgICAnPCUgXy5lYWNoKG9wdGlvbnMsIGZ1bmN0aW9uIChvcHRpb24pIHsgJT4nICtcbiAgICAgICAgICAgICAgICAnPG9wdGlvbiB2YWx1ZT1cIjwlLSBvcHRpb24udmFsdWUgJT5cIj48JS0gb3B0aW9uLmRpc3BsYXkgJT48L29wdGlvbj4nICtcbiAgICAgICAgICAgICc8JSB9KTsgJT4nXG4gICAgICAgICksXG4gICAgICAgIGV2ZW50czoge1xuICAgICAgICAgICAgY2hhbmdlOiAndXBkYXRlVmFsdWUnXG4gICAgICAgIH0sXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZUhlbHBlcnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnM7XG4gICAgICAgIH0sXG4gICAgICAgIHVwZGF0ZVZhbHVlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLm1vZGVsLnNldCgndmFsdWUnLCB0aGlzLnZhbCgpKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgb3JiLnVpLlF1ZXJ5QnVpbGRlci5FZGl0b3JzLkRhdGVGaWVsZCA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcbiAgICAgICAgdGFnTmFtZTogJ3NwYW4nLFxuICAgICAgICB0ZW1wbGF0ZTogXy50ZW1wbGF0ZShcbiAgICAgICAgICAgICc8aW5wdXQgY2xhc3M9XCJmb3JtLWNvbnRyb2wgaW5wdXQtc21cIiB2YWx1ZT1cIjwlLSB2YWx1ZSAlPlwiIHR5cGU9XCJkYXRlXCIvPidcbiAgICAgICAgKSxcbiAgICAgICAgZXZlbnRzOiB7XG4gICAgICAgICAgICAnY2hhbmdlIGlucHV0JzogJ3VwZGF0ZVZhbHVlJ1xuICAgICAgICB9LFxuICAgICAgICB1cGRhdGVWYWx1ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5tb2RlbC5zZXQoJ3ZhbHVlJywgdGhpcy4kKCdpbnB1dCcpLnZhbCgpKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgb3JiLnVpLlF1ZXJ5QnVpbGRlci5FZGl0b3JzLkJldHdlZW5GaWVsZCA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcbiAgICAgICAgdGFnTmFtZTogJ3NwYW4nLFxuICAgICAgICB0ZW1wbGF0ZTogXy50ZW1wbGF0ZShcbiAgICAgICAgICAgICc8aW5wdXQgY2xhc3M9XCJmb3JtLWNvbnRyb2wgaW5wdXQtc21cIiB2YWx1ZT1cIjwlLSB2YWx1ZSAlPlwiIHR5cGU9XCJkYXRlXCIvPicgK1xuICAgICAgICAgICAgJzxpbnB1dCBjbGFzcz1cImZvcm0tY29udHJvbCBpbnB1dC1zbVwiIHZhbHVlPVwiPCUtIHZhbHVlICU+XCIgdHlwZT1cImRhdGVcIi8+J1xuICAgICAgICApXG4gICAgfSk7XG59KSh3aW5kb3cub3JiLCB3aW5kb3cuTWFyaW9uZXR0ZSk7IiwiKGZ1bmN0aW9uIChvcmIsIE1hcmlvbmV0dGUsICQpIHtcbiAgICBvcmIudWkuUXVlcnlJdGVtID0gTWFyaW9uZXR0ZS5MYXlvdXRWaWV3LmV4dGVuZCh7XG4gICAgICAgIHRhZ05hbWU6ICdsaScsXG4gICAgICAgIG1vZGVsOiBvcmIuUXVlcnksXG4gICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgIGNsYXNzOiAncXVlcnktaXRlbSdcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IF8udGVtcGxhdGUoXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cImZvcm0tZ3JvdXAgaXRlbS1jb250ZW50XCI+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJzZWxlY3RvclwiPjwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPVwiYnRuIGJ0bi1kZWZhdWx0IGFjdGlvbi1idG4gYnRuLXNtXCIgZGF0YS1hY3Rpb249XCJyZW1vdmVkXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8c3Ryb25nPiZ0aW1lczs8L3N0cm9uZz4nICtcbiAgICAgICAgICAgICAgICAnPC9idXR0b24+JyArXG4gICAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwiZWRpdG9yLWFyZWFcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxzZWxlY3QgaWQ9XCJjb2x1bW4tZGRsXCIgY2xhc3M9XCJmb3JtLWNvbnRyb2wgaW5wdXQtc21cIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8JSBfLmVhY2goc2NoZW1hLmNvbHVtbnMsIGZ1bmN0aW9uIChjb2wpIHsgJT4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPG9wdGlvbiB2YWx1ZT1cIjwlLSBjb2wuZmllbGQgJT5cIj48JS0gY29sLmRpc3BsYXkgJT48L29wdGlvbj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8JSB9KTsgJT4nICtcbiAgICAgICAgICAgICAgICAgICAgJzwvc2VsZWN0PicgK1xuICAgICAgICAgICAgICAgICAgICAnPHNlbGVjdCBpZD1cInJ1bGUtZGRsXCIgY2xhc3M9XCJmb3JtLWNvbnRyb2wgaW5wdXQtc21cIj48L3NlbGVjdD4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwiaXRlbS1lZGl0b3JcIj48L3NwYW4+JyArXG4gICAgICAgICAgICAgICAgJzwvc3Bhbj4nICtcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImJ0bi1ncm91cCBzd2l0Y2gtYnRuLWdyb3VwIGJ0bi1ncm91cC1zbSBwdWxsLXJpZ2h0XCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiYnRuIGJ0bi1kZWZhdWx0IGFjdGlvbi1idG4gPCUtIChwYXJlbnRfb3AgPT0gXCJhbmRcIikgPyBcInNlbGVjdGVkXCIgOiBcImFjdGl2ZVwiICU+XCInICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZGF0YS1hY3Rpb249XCJzd2l0Y2hcIiBkYXRhLWFjdGlvbi12YWx1ZT1cImFuZFwiIGRhdGEtYWN0aW9uLXRvZ2dsZT1cInRydWVcIj5BbmQ8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJidG4gYnRuLWRlZmF1bHQgYWN0aW9uLWJ0biA8JS0gKHBhcmVudF9vcCA9PSBcIm9yXCIpID8gXCJzZWxlY3RlZFwiIDogXCJhY3RpdmVcIiAlPlwiJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2RhdGEtYWN0aW9uPVwic3dpdGNoXCIgZGF0YS1hY3Rpb24tdmFsdWU9XCJvclwiIGRhdGEtYWN0aW9uLXRvZ2dsZT1cInRydWVcIj5PcjwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICc8L2Rpdj4nXG4gICAgICAgICksXG4gICAgICAgIHJlZ2lvbnM6IHtcbiAgICAgICAgICAgIGVkaXRvcjogJy5pdGVtLWVkaXRvcidcbiAgICAgICAgfSxcbiAgICAgICAgZXZlbnRzOiB7XG4gICAgICAgICAgICAnY2hhbmdlICNjb2x1bW4tZGRsJzogJ2xvYWRSdWxlcycsXG4gICAgICAgICAgICAnY2hhbmdlICNydWxlLWRkbCc6ICdhc3NpZ25FZGl0b3InLFxuICAgICAgICAgICAgJ2NsaWNrID4gLml0ZW0tY29udGVudCAuYWN0aW9uLWJ0bic6ICd0cmlnZ2VyQWN0aW9uJyxcbiAgICAgICAgICAgICdjbGljayAuc2VsZWN0b3InOiAndG9nZ2xlU2VsZWN0ZWQnXG4gICAgICAgIH0sXG4gICAgICAgIGFzc2lnbkVkaXRvcjogZnVuY3Rpb24gKGV2ZW50LCBvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgICAgIGlmICghb3B0aW9ucy5jb2x1bW4pIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLmNvbHVtbiA9IHRoaXMuY3VycmVudENvbHVtbigpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcnVsZXMgPSBvcmIudWkuUXVlcnlCdWlsZGVyLlJ1bGVzW29wdGlvbnMuY29sdW1uLnR5cGVdIHx8IHt9O1xuICAgICAgICAgICAgdmFyIHJ1bGUgPSBydWxlc1t0aGlzLiQoJyNydWxlLWRkbCBvcHRpb246c2VsZWN0ZWQnKS50ZXh0KCldIHx8IHt9O1xuICAgICAgICAgICAgaWYgKHJ1bGUuZWRpdG9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tb2RlbC5zZXQoJ29wJywgcnVsZS5vcCk7XG4gICAgICAgICAgICAgICAgdGhpcy5lZGl0b3Iuc2hvdyhuZXcgcnVsZS5lZGl0b3IoXy5leHRlbmQoe30sIHttb2RlbDogdGhpcy5tb2RlbH0sIHJ1bGUub3B0aW9ucykpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy4kKCcuaXRlbS1lZGl0b3InKS5lbXB0eSgpO1xuICAgICAgICAgICAgICAgIHRoaXMubW9kZWwuc2V0KCd2YWx1ZScsIHJ1bGUudmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBjdXJyZW50Q29sdW1uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zY2hlbWEuY29sdW1uc1t0aGlzLiQoJyNjb2x1bW4tZGRsJykudmFsKCldO1xuICAgICAgICB9LFxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgc2VsZi5zY2hlbWEgPSBvcHRpb25zLnNjaGVtYTtcbiAgICAgICAgICAgIHNlbGYucGFyZW50TW9kZWwgPSBvcHRpb25zLnBhcmVudE1vZGVsO1xuICAgICAgICB9LFxuICAgICAgICBvblJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5sb2FkUnVsZXMoe30sIHtcbiAgICAgICAgICAgICAgICBjb2x1bW46IHRoaXMuc2NoZW1hLmNvbHVtbnNbdGhpcy5tb2RlbC5nZXQoJ2NvbHVtbicpXSxcbiAgICAgICAgICAgICAgICBvcDogdGhpcy5tb2RlbC5nZXQoJ29wJyksXG4gICAgICAgICAgICAgICAgdmFsdWU6IHRoaXMubW9kZWwuZ2V0KCd2YWx1ZScpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgbG9hZFJ1bGVzOiBmdW5jdGlvbiAoZXZlbnQsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgICAgICBpZiAoIW9wdGlvbnMuY29sdW1uKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5jb2x1bW4gPSB0aGlzLmN1cnJlbnRDb2x1bW4oKTtcbiAgICAgICAgICAgICAgICB0aGlzLm1vZGVsLnNldCgnY29sdW1uJywgb3B0aW9ucy5jb2x1bW4uZmllbGQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLiQoJyNjb2x1bW4tZGRsJykudmFsKG9wdGlvbnMuY29sdW1uLmZpZWxkKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFvcHRpb25zLm9wKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5vcCA9IG9yYi5RLk9wLklzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcnVsZXMgPSBvcmIudWkuUXVlcnlCdWlsZGVyLlJ1bGVzW29wdGlvbnMuY29sdW1uLnR5cGVdO1xuICAgICAgICAgICAgdmFyICRkZGwgPSB0aGlzLiQoJyNydWxlLWRkbCcpO1xuICAgICAgICAgICAgJGRkbC5lbXB0eSgpO1xuICAgICAgICAgICAgXy5lYWNoKHJ1bGVzLCBmdW5jdGlvbiAocnVsZSwgZGlzcGxheSkge1xuICAgICAgICAgICAgICAgIHZhciBzZWxlY3RlZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICBpZiAocnVsZS5tYXRjaGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkID0gcnVsZS5tYXRjaGVzKHNlbGYubW9kZWwpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkID0gcnVsZS5vcCA9PSBvcHRpb25zLm9wO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICRkZGwuYXBwZW5kKCc8b3B0aW9uIFwiJyArIGRpc3BsYXkgKyAnXCIgJyArIChzZWxlY3RlZCA/ICdzZWxlY3RlZCcgOiAnJykgKyAnPicgKyBkaXNwbGF5ICsgJzwvb3B0aW9uJylcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5hc3NpZ25FZGl0b3Ioe30sIG9wdGlvbnMpO1xuICAgICAgICB9LFxuICAgICAgICB0b2dnbGVTZWxlY3RlZDogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICB0aGlzLiQoJy5zZWxlY3RvcicpLnRvZ2dsZUNsYXNzKCdzZWxlY3RlZCcpO1xuICAgICAgICB9LFxuICAgICAgICB0cmlnZ2VyQWN0aW9uOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIHZhciAkZWwgPSAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpO1xuICAgICAgICAgICAgdmFyIGFjdGlvbiA9ICRlbC5kYXRhKCdhY3Rpb24nKTtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9ICRlbC5kYXRhKCdhY3Rpb25WYWx1ZScpO1xuICAgICAgICAgICAgdmFyIHRvZ2dsZSA9ICRlbC5kYXRhKCdhY3Rpb25Ub2dnbGUnKTtcblxuICAgICAgICAgICAgaWYgKHRvZ2dsZSkge1xuICAgICAgICAgICAgICAgIHZhciAkZWxlbXMgPSB0aGlzLiQoJ1tkYXRhLWFjdGlvbj1cIicgKyBhY3Rpb24gKyAnXCJdJyk7XG4gICAgICAgICAgICAgICAgJGVsZW1zLmFkZENsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgICAgICAgICAkZWwucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyKCdhY3Rpb246JyArIGFjdGlvbiwgdmFsdWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXIoJ2FjdGlvbjonICsgYWN0aW9uLCB2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlSGVscGVyczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGNvbHVtbl9uYW1lID0gdGhpcy5tb2RlbC5nZXQoJ2NvbHVtbicpIHx8IF8ua2V5cyh0aGlzLnNjaGVtYS5jb2x1bW5zKVswXTtcbiAgICAgICAgICAgIHZhciBjb2x1bW4gPSB0aGlzLnNjaGVtYS5jb2x1bW5zW2NvbHVtbl9uYW1lXTtcblxuICAgICAgICAgICAgdmFyIGhlbHBlcnMgPSB7XG4gICAgICAgICAgICAgICAgc2NoZW1hOiB0aGlzLnNjaGVtYSxcbiAgICAgICAgICAgICAgICBwYXJlbnRfb3A6IHRoaXMucGFyZW50TW9kZWwuZ2V0KCdvcCcpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIGhlbHBlcnM7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIG9yYi51aS5RdWVyeUNvbXBvdW5kSXRlbSA9IE1hcmlvbmV0dGUuTGF5b3V0Vmlldy5leHRlbmQoe1xuICAgICAgICB0YWdOYW1lOiAnbGknLFxuICAgICAgICBtb2RlbDogb3JiLlF1ZXJ5Q29tcG91bmQsXG4gICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgIGNsYXNzOiAncXVlcnktaXRlbSBxdWVyeS1jb21wb3VuZC1pdGVtJ1xuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogXy50ZW1wbGF0ZShcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiZm9ybS1ncm91cCBpdGVtLWNvbnRlbnRcIj4nICtcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cInNlbGVjdG9yXCI+PC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzxidXR0b24gY2xhc3M9XCJidG4gYnRuLWRlZmF1bHQgYnRuLXNtIGFjdGlvbi1idG5cIiBkYXRhLWFjdGlvbj1cInJlbW92ZWRcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxzdHJvbmc+JnRpbWVzOzwvc3Ryb25nPicgK1xuICAgICAgICAgICAgICAgICc8L2J1dHRvbj4nICtcbiAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJlZGl0b3ItYXJlYVwiPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGVtPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxhIGhyZWY9XCIjXCIgY2xhc3M9XCJ0ZXh0LW11dGVkIHRvZ2dsZS1saW5rXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxpIGNsYXNzPVwiZmEgZmEtc20gZmEtY2FyZXQtcmlnaHRcIj48L2k+Jm5ic3A7Jm5ic3A7JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1F1ZXJ5IEdyb3VwJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9hPicgK1xuICAgICAgICAgICAgICAgICAgICAnPC9lbT4nICtcbiAgICAgICAgICAgICAgICAnPC9zcGFuPicgK1xuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiYnRuLWdyb3VwIHN3aXRjaC1idG4tZ3JvdXAgYnRuLWdyb3VwLXNtIHB1bGwtcmlnaHRcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJidG4gYnRuLWRlZmF1bHQgYWN0aW9uLWJ0biA8JS0gKHBhcmVudF9vcCA9PSBcImFuZFwiKSA/IFwic2VsZWN0ZWRcIiA6IFwiYWN0aXZlXCIgJT5cIicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdkYXRhLWFjdGlvbj1cInN3aXRjaFwiIGRhdGEtYWN0aW9uLXZhbHVlPVwiYW5kXCIgZGF0YS1hY3Rpb24tdG9nZ2xlPVwidHJ1ZVwiPkFuZDwvZGl2PicgK1xuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImJ0biBidG4tZGVmYXVsdCBhY3Rpb24tYnRuIDwlLSAocGFyZW50X29wID09IFwib3JcIikgPyBcInNlbGVjdGVkXCIgOiBcImFjdGl2ZVwiICU+XCInICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZGF0YS1hY3Rpb249XCJzd2l0Y2hcIiBkYXRhLWFjdGlvbi12YWx1ZT1cIm9yXCIgZGF0YS1hY3Rpb24tdG9nZ2xlPVwidHJ1ZVwiPk9yPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgJzxkaXYgaWQ9XCJzdWItcXVlcnktY29udGFpbmVyXCIgY2xhc3M9XCJmb3JtLWdyb3VwXCI+PC9kaXY+J1xuICAgICAgICApLFxuICAgICAgICByZWdpb25zOiB7XG4gICAgICAgICAgICBzdWJRdWVyeUNvbnRhaW5lcjogJyNzdWItcXVlcnktY29udGFpbmVyJ1xuICAgICAgICB9LFxuICAgICAgICBldmVudHM6IHtcbiAgICAgICAgICAgICdjaGFuZ2UgI2NvbHVtbi1kZGwnOiAnbG9hZFJ1bGVzJyxcbiAgICAgICAgICAgICdjaGFuZ2UgI3J1bGUtZGRsJzogJ2Fzc2lnbkVkaXRvcicsXG4gICAgICAgICAgICAnY2xpY2sgPiAuaXRlbS1jb250ZW50IC5hY3Rpb24tYnRuJzogJ3RyaWdnZXJBY3Rpb24nLFxuICAgICAgICAgICAgJ2NsaWNrIC5zZWxlY3Rvcic6ICd0b2dnbGVTZWxlY3RlZCcsXG4gICAgICAgICAgICAnY2xpY2sgPiAuaXRlbS1jb250ZW50IC50b2dnbGUtbGluayc6ICd0b2dnbGVHcm91cCdcbiAgICAgICAgfSxcbiAgICAgICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIHNlbGYuZXhwYW5kZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHNlbGYuc2NoZW1hID0gb3B0aW9ucy5zY2hlbWE7XG4gICAgICAgICAgICBzZWxmLnBhcmVudE1vZGVsID0gb3B0aW9ucy5wYXJlbnRNb2RlbDtcbiAgICAgICAgfSxcbiAgICAgICAgdG9nZ2xlR3JvdXA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIHZhciAkdG9nZ2xlID0gdGhpcy4kKCc+IC5pdGVtLWNvbnRlbnQgLnRvZ2dsZS1saW5rJyk7XG4gICAgICAgICAgICB2YXIgJGljb24gPSAkdG9nZ2xlLmZpbmQoJ2knKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmV4cGFuZGVkKSB7XG4gICAgICAgICAgICAgICAgJGljb24uYWRkQ2xhc3MoJ2ZhLWNhcmV0LXJpZ2h0Jyk7XG4gICAgICAgICAgICAgICAgJGljb24ucmVtb3ZlQ2xhc3MoJ2ZhLWNhcmV0LWRvd24nKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuc3ViUXVlcnlDb250YWluZXIuZW1wdHkoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJGljb24ucmVtb3ZlQ2xhc3MoJ2ZhLWNhcmV0LXJpZ2h0Jyk7XG4gICAgICAgICAgICAgICAgJGljb24uYWRkQ2xhc3MoJ2ZhLWNhcmV0LWRvd24nKTtcblxuICAgICAgICAgICAgICAgIHZhciBidWlsZGVyID0gbmV3IG9yYi51aS5RdWVyeUJ1aWxkZXIoe1xuICAgICAgICAgICAgICAgICAgICBzY2hlbWE6IHNlbGYuc2NoZW1hLFxuICAgICAgICAgICAgICAgICAgICBtb2RlbDogc2VsZi5tb2RlbCxcbiAgICAgICAgICAgICAgICAgICAgbmVzdGVkOiB0cnVlXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnN1YlF1ZXJ5Q29udGFpbmVyLnNob3coYnVpbGRlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmV4cGFuZGVkID0gIXRoaXMuZXhwYW5kZWQ7XG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlSGVscGVyczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGNvbHVtbl9uYW1lID0gdGhpcy5tb2RlbC5jb2x1bW4gfHwgXy5rZXlzKHRoaXMuc2NoZW1hLmNvbHVtbnMpWzBdO1xuICAgICAgICAgICAgdmFyIGNvbHVtbiA9IHRoaXMuc2NoZW1hLmNvbHVtbnNbY29sdW1uX25hbWVdO1xuXG4gICAgICAgICAgICB2YXIgaGVscGVycyA9IHtcbiAgICAgICAgICAgICAgICBzY2hlbWE6IHRoaXMuc2NoZW1hLFxuICAgICAgICAgICAgICAgIHJ1bGVzOiBvcmIudWkuUXVlcnlCdWlsZGVyLlJ1bGVzW2NvbHVtbi50eXBlXSxcbiAgICAgICAgICAgICAgICBwYXJlbnRfb3A6IHRoaXMucGFyZW50TW9kZWwuZ2V0KCdvcCcpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIGhlbHBlcnM7XG4gICAgICAgIH0sXG4gICAgICAgIHRyaWdnZXJBY3Rpb246IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgdmFyICRlbCA9ICQoZXZlbnQuY3VycmVudFRhcmdldCk7XG4gICAgICAgICAgICB2YXIgYWN0aW9uID0gJGVsLmRhdGEoJ2FjdGlvbicpO1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gJGVsLmRhdGEoJ2FjdGlvblZhbHVlJyk7XG4gICAgICAgICAgICB2YXIgdG9nZ2xlID0gJGVsLmRhdGEoJ2FjdGlvblRvZ2dsZScpO1xuXG4gICAgICAgICAgICBpZiAodG9nZ2xlKSB7XG4gICAgICAgICAgICAgICAgdmFyICRlbGVtcyA9IHRoaXMuJCgnPiBpdGVtLWNvbnRlbnQgW2RhdGEtYWN0aW9uPVwiJyArIGFjdGlvbiArICdcIl0nKTtcbiAgICAgICAgICAgICAgICAkZWxlbXMuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICAgICAgICAgICRlbC5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXIoJ2FjdGlvbjonICsgYWN0aW9uLCB2YWx1ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcignYWN0aW9uOicgKyBhY3Rpb24sIHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgb3JiLnVpLlF1ZXJ5QnVpbGRlciA9IE1hcmlvbmV0dGUuQ29tcG9zaXRlVmlldy5leHRlbmQoe1xuICAgICAgICB0YWdOYW1lOiAnZGl2JyxcbiAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgY2xhc3M6ICdxdWVyeWJ1aWxkZXIgZm9ybSBmb3JtLWlubGluZScsXG4gICAgICAgICAgICByb2xlOiAnZm9ybSdcbiAgICAgICAgfSxcbiAgICAgICAgY2hpbGRWaWV3OiBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgaWYgKGl0ZW0ubW9kZWwgaW5zdGFuY2VvZiBvcmIuUSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgb3JiLnVpLlF1ZXJ5SXRlbShpdGVtKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBvcmIudWkuUXVlcnlDb21wb3VuZEl0ZW0oaXRlbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGNoaWxkVmlld0NvbnRhaW5lcjogJy5xdWVyeS1pdGVtcycsXG4gICAgICAgIGNoaWxkVmlld09wdGlvbnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc2NoZW1hOiB0aGlzLnNjaGVtYSxcbiAgICAgICAgICAgICAgICBwYXJlbnRNb2RlbDogdGhpcy5tb2RlbFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgY2hpbGRFdmVudHM6IHtcbiAgICAgICAgICAgICdhY3Rpb246c3dpdGNoJzogJ3N3aXRjaE9wJyxcbiAgICAgICAgICAgICdhY3Rpb246cmVtb3ZlZCc6ICdyZW1vdmVRdWVyeSdcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IF8udGVtcGxhdGUoXG4gICAgICAgICAgICAnPHVsIGNsYXNzPVwibGlzdC11bnN0eWxlZCBxdWVyeS1pdGVtc1wiPjwvdWw+JyArXG4gICAgICAgICAgICAnPCUgaWYgKCFuZXN0ZWQpIHsgJT4nICtcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiaGVscFwiPicgK1xuICAgICAgICAgICAgICAgICc8c21hbGwgY2xhc3M9XCJ0ZXh0LW11dGVkXCI+PGVtPkhvbGQgY3RybCBvciBtZXRhIGtleSB0byBzZWxlY3QgYW5kIGdyb3VwIHF1ZXJpZXMuPC9lbT48L3NtYWxsPicgK1xuICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgJzwlIH0gJT4nXG4gICAgICAgICksXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICAgICAgaWYgKG9wdGlvbnMubW9kZWxUeXBlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zY2hlbWEgPSBvcHRpb25zLm1vZGVsVHlwZS5zY2hlbWE7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuc2NoZW1hID0gb3B0aW9ucy5zY2hlbWE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghdGhpcy5tb2RlbCkge1xuICAgICAgICAgICAgICAgIHRoaXMubW9kZWwgPSBuZXcgb3JiLlFDb21wb3VuZCgpO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIHRoaXMubW9kZWxUeXBlID0gb3B0aW9ucy5tb2RlbFR5cGUgfHwgdW5kZWZpbmVkO1xuICAgICAgICAgICAgdGhpcy5uZXN0ZWQgPSBvcHRpb25zLm5lc3RlZDtcbiAgICAgICAgICAgIHRoaXMuY29sbGVjdGlvbiA9IG9wdGlvbnMuY29sbGVjdGlvbiB8fCB0aGlzLm1vZGVsLnF1ZXJpZXM7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmNvbGxlY3Rpb24uaXNFbXB0eSgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb2xsZWN0aW9uLmFkZChuZXcgb3JiLlEoKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNlbGYubGlzdGVuVG8ob3JiLnVpLCAnY2hhbmdlOm1ldGFLZXknLCBmdW5jdGlvbiAoZXZlbnQsIHN0YXRlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFzdGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgJGdyb3VwID0gc2VsZi4kKCc+IC5xdWVyeS1pdGVtcyA+IC5xdWVyeS1pdGVtID4gLml0ZW0tY29udGVudCAuc2VsZWN0b3Iuc2VsZWN0ZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgJGdyb3VwLnJlbW92ZUNsYXNzKCdzZWxlY3RlZCcpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGV4dHJhY3QgdGhlc2UgcXVlcmllcyBmcm9tIHRoaXMgbW9kZWwgYW5kIGluc2VydCB0aGVtIGludG8gYSBuZXcgZ3JvdXAgcXVlcnlcbiAgICAgICAgICAgICAgICAgICAgdmFyIHF1ZXJpZXMgPSBbXTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBleHRyYWN0IHRoZSBxdWVyaWVzIHRoYXQgYXJlIGdvaW5nIHRvIGJlIGdyb3VwZWQgdG9nZXRoZXJcbiAgICAgICAgICAgICAgICAgICAgJGdyb3VwLmVhY2goZnVuY3Rpb24gKGksIHNlbGVjdG9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgJGl0ZW0gPSAkKHNlbGVjdG9yKS5jbG9zZXN0KCdsaScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHF1ZXJ5ID0gc2VsZi5jb2xsZWN0aW9uLmF0KCRpdGVtLmluZGV4KCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcXVlcmllcy5wdXNoKHF1ZXJ5KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHF1ZXJpZXMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY3JlYXRlIHRoZSBuZXcgZ3JvdXBcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuZXdfZ3JvdXAgPSBuZXcgb3JiLlFDb21wb3VuZCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3A6IHNlbGYubW9kZWwuZ2V0KCdvcCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXJpZXM6IG5ldyBCYWNrYm9uZS5Db2xsZWN0aW9uKHF1ZXJpZXMpXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVtb3ZlIHRoZSBxdWVyaWVzIGZyb20gdGhpcyBtb2RlbFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tb2RlbC5xdWVyaWVzLnJlbW92ZShxdWVyaWVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubW9kZWwucXVlcmllcy5hZGQobmV3X2dyb3VwKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICByZW1vdmVRdWVyeTogZnVuY3Rpb24gKHF1ZXJ5KSB7XG4gICAgICAgICAgICBpZiAodGhpcy5jb2xsZWN0aW9uLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbGxlY3Rpb24ucmVtb3ZlKHF1ZXJ5Lm1vZGVsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgc3dpdGNoT3A6IGZ1bmN0aW9uIChldmVudCwgb3ApIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm1vZGVsLmdldCgnb3AnKSAhPT0gb3ApIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1vZGVsLnNldCgnb3AnLCBvcCk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY29sbGVjdGlvbi5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb2xsZWN0aW9uLmFkZChuZXcgb3JiLlEoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbGxlY3Rpb24uYWRkKG5ldyBvcmIuUSgpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gdXBkYXRlIGNoaWxkIGl0ZW1zXG4gICAgICAgICAgICB0aGlzLiQoJz4gLnF1ZXJ5LWl0ZW1zID4gLnF1ZXJ5LWl0ZW0gPiAuaXRlbS1jb250ZW50IC5hY3Rpb24tYnRuW2RhdGEtYWN0aW9uPVwic3dpdGNoXCJdJykuZWFjaChmdW5jdGlvbiAoaSwgaXRlbSkge1xuICAgICAgICAgICAgICAgIHZhciAkaXRlbSA9ICQoaXRlbSk7XG4gICAgICAgICAgICAgICAgaWYgKCRpdGVtLmRhdGEoJ2FjdGlvbi12YWx1ZScpID09PSBvcCkge1xuICAgICAgICAgICAgICAgICAgICAkaXRlbS5yZW1vdmVDbGFzcygnYWN0aXZlJykuYWRkQ2xhc3MoJ3NlbGVjdGVkJyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgJGl0ZW0ucmVtb3ZlQ2xhc3MoJ3NlbGVjdGVkJykuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZUhlbHBlcnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmVzdGVkOiB0aGlzLm5lc3RlZFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAgRWRpdG9yczoge30sXG4gICAgICAgIFJ1bGVzOiB7fVxuICAgIH0pO1xuXG5cbn0pKHdpbmRvdy5vcmIsIHdpbmRvdy5NYXJpb25ldHRlLCAkKTsiLCIoZnVuY3Rpb24gKG9yYikge1xuICAgIC8vIGRlZmluZSBjb21tb25seSByZXVzYWJsZSBydWxlc1xuICAgIHZhciBudWxsX2lucHV0cyA9IHtcbiAgICAgICAgJ2lzIG51bGwnOiB7XG4gICAgICAgICAgICBvcDogb3JiLlEuT3AuSXMsXG4gICAgICAgICAgICB2YWx1ZTogbnVsbCxcbiAgICAgICAgICAgIG1hdGNoZXM6IGZ1bmN0aW9uIChtb2RlbCkgeyByZXR1cm4gKG1vZGVsLmdldCgnb3AnKSA9PT0gb3JiLlEuT3AuSXMgJiYgbW9kZWwuZ2V0KCd2YWx1ZScpID09PSBudWxsKTsgfVxuICAgICAgICB9LFxuICAgICAgICAnaXMgbm90IG51bGwnOiB7XG4gICAgICAgICAgICBvcDogb3JiLlEuT3AuSXNOb3QsXG4gICAgICAgICAgICB2YWx1ZTogbnVsbCxcbiAgICAgICAgICAgIG1hdGNoZXM6IGZ1bmN0aW9uIChtb2RlbCkgeyByZXR1cm4gKG1vZGVsLmdldCgnb3AnKSA9PT0gb3JiLlEuT3AuSXNOb3QgJiYgbW9kZWwuZ2V0KCd2YWx1ZScpID09PSBudWxsKTsgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBiYXNpY19pbnB1dHMgPSB7XG4gICAgICAgICdpcyc6IHtcbiAgICAgICAgICAgIG9wOiBvcmIuUS5PcC5JcyxcbiAgICAgICAgICAgIGVkaXRvcjogb3JiLnVpLlF1ZXJ5QnVpbGRlci5FZGl0b3JzLklucHV0RmllbGRcbiAgICAgICAgfSxcbiAgICAgICAgJ2lzIG5vdCc6IHtcbiAgICAgICAgICAgIG9wOiBvcmIuUS5PcC5Jc05vdCxcbiAgICAgICAgICAgIGVkaXRvcjogb3JiLnVpLlF1ZXJ5QnVpbGRlci5FZGl0b3JzLklucHV0RmllbGRcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgdGV4dF9pbnB1dHMgPSB7XG4gICAgICAgICdjb250YWlucyc6IHtcbiAgICAgICAgICAgIG9wOiBvcmIuUS5PcC5Db250YWlucyxcbiAgICAgICAgICAgIGVkaXRvcjogb3JiLnVpLlF1ZXJ5QnVpbGRlci5FZGl0b3JzLklucHV0RmllbGRcbiAgICAgICAgfSxcbiAgICAgICAgJ2RvZXMgbm90IGNvbnRhaW4nOiB7XG4gICAgICAgICAgICBvcDogb3JiLlEuT3AuRG9lc05vdENvbnRhaW4sXG4gICAgICAgICAgICBlZGl0b3I6IG9yYi51aS5RdWVyeUJ1aWxkZXIuRWRpdG9ycy5JbnB1dEZpZWxkXG4gICAgICAgIH0sXG4gICAgICAgICdzdGFydHMgd2l0aCc6IHtcbiAgICAgICAgICAgIG9wOiBvcmIuUS5PcC5TdGFydHN3aXRoLFxuICAgICAgICAgICAgZWRpdG9yOiBvcmIudWkuUXVlcnlCdWlsZGVyLkVkaXRvcnMuSW5wdXRGaWVsZFxuICAgICAgICB9LFxuICAgICAgICAnZG9lcyBub3Qgc3RhcnQgd2l0aCc6IHtcbiAgICAgICAgICAgIG9wOiBvcmIuUS5PcC5Eb2VzTm90U3RhcnR3aXRoLFxuICAgICAgICAgICAgZWRpdG9yOiBvcmIudWkuUXVlcnlCdWlsZGVyLkVkaXRvcnMuSW5wdXRGaWVsZFxuICAgICAgICB9LFxuICAgICAgICAnZW5kcyB3aXRoJzoge1xuICAgICAgICAgICAgb3A6IG9yYi5RLk9wLlN0YXJ0c3dpdGgsXG4gICAgICAgICAgICBlZGl0b3I6IG9yYi51aS5RdWVyeUJ1aWxkZXIuRWRpdG9ycy5JbnB1dEZpZWxkXG4gICAgICAgIH0sXG4gICAgICAgICdkb2VzIG5vdCBlbmQgd2l0aCc6IHtcbiAgICAgICAgICAgIG9wOiBvcmIuUS5PcC5Eb2VzTm90RW5kd2l0aCxcbiAgICAgICAgICAgIGVkaXRvcjogb3JiLnVpLlF1ZXJ5QnVpbGRlci5FZGl0b3JzLklucHV0RmllbGRcbiAgICAgICAgfSxcbiAgICAgICAgJ21hdGNoZXMnOiB7XG4gICAgICAgICAgICBvcDogb3JiLlEuT3AuTWF0Y2hlcyxcbiAgICAgICAgICAgIGVkaXRvcjogb3JiLnVpLlF1ZXJ5QnVpbGRlci5FZGl0b3JzLklucHV0RmllbGRcbiAgICAgICAgfSxcbiAgICAgICAgJ2RvZXMgbm90IG1hdGNoJzoge1xuICAgICAgICAgICAgb3A6IG9yYi5RLk9wLkRvZXNOb3RNYXRjaCxcbiAgICAgICAgICAgIGVkaXRvcjogb3JiLnVpLlF1ZXJ5QnVpbGRlci5FZGl0b3JzLklucHV0RmllbGRcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgYm9vbF9pbnB1dHMgPSB7XG4gICAgICAgICdpcyc6IHtcbiAgICAgICAgICAgIG9wOiBvcmIuUS5PcC5JcyxcbiAgICAgICAgICAgIGVkaXRvcjogb3JiLnVpLlF1ZXJ5QnVpbGRlci5FZGl0b3JzLlNlbGVjdEZpZWxkLFxuICAgICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgICAgIG9wdGlvbnM6IFt7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiAndHJ1ZScsXG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdUcnVlJ1xuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICdmYWxzZScsXG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdGYWxzZSdcbiAgICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICAnaXMgbm90Jzoge1xuICAgICAgICAgICAgb3A6IG9yYi5RLk9wLklzLFxuICAgICAgICAgICAgZWRpdG9yOiBvcmIudWkuUXVlcnlCdWlsZGVyLkVkaXRvcnMuU2VsZWN0RmllbGQsXG4gICAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgb3B0aW9uczogW3tcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICd0cnVlJyxcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ1RydWUnXG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJ2ZhbHNlJyxcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ0ZhbHNlJ1xuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIGRhdGVfaW5wdXRzID0ge1xuICAgICAgICAnaXMnOiB7XG4gICAgICAgICAgICBvcDogb3JiLlEuT3AuSXMsXG4gICAgICAgICAgICBlZGl0b3I6IG9yYi51aS5RdWVyeUJ1aWxkZXIuRWRpdG9ycy5EYXRlRmllbGRcbiAgICAgICAgfSxcbiAgICAgICAgJ2lzIG5vdCc6IHtcbiAgICAgICAgICAgIG9wOiBvcmIuUS5PcC5JcyxcbiAgICAgICAgICAgIGVkaXRvcjogb3JiLnVpLlF1ZXJ5QnVpbGRlci5FZGl0b3JzLkRhdGVGaWVsZFxuICAgICAgICB9LFxuICAgICAgICAnYWZ0ZXInOiB7XG4gICAgICAgICAgICBvcDogb3JiLlEuT3AuQWZ0ZXIsXG4gICAgICAgICAgICBlZGl0b3I6IG9yYi51aS5RdWVyeUJ1aWxkZXIuRWRpdG9ycy5EYXRlRmllbGRcbiAgICAgICAgfSxcbiAgICAgICAgJ2JlZm9yZSc6IHtcbiAgICAgICAgICAgIG9wOiBvcmIuUS5PcC5CZWZvcmUsXG4gICAgICAgICAgICBlZGl0b3I6IG9yYi51aS5RdWVyeUJ1aWxkZXIuRWRpdG9ycy5EYXRlRmllbGRcbiAgICAgICAgfSxcbiAgICAgICAgJ2JldHdlZW4nOiB7XG4gICAgICAgICAgICBvcDogb3JiLlEuT3AuQmV0d2VlbixcbiAgICAgICAgICAgIGVkaXRvcjogb3JiLnVpLlF1ZXJ5QnVpbGRlci5FZGl0b3JzLkJldHdlZW5GaWVsZFxuICAgICAgICB9XG4gICAgfTtcbiAgICBcbiAgICB2YXIgcmVmX2lucHV0cyA9IHtcbiAgICAgICAgJ2lzJzoge1xuICAgICAgICAgICAgb3A6IG9yYi5RLk9wLklzLFxuICAgICAgICAgICAgZWRpdG9yOiBvcmIudWkuUXVlcnlCdWlsZGVyLkVkaXRvcnMuSW5wdXRGaWVsZFxuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIGRlZmluZSBjb2x1bW4gc3BlY2lmaWMgcnVsZXNcbiAgICBvcmIudWkuUXVlcnlCdWlsZGVyLlJ1bGVzLklkID0gXy5leHRlbmQoe30sIGJhc2ljX2lucHV0cywgbnVsbF9pbnB1dHMpO1xuXG4gICAgb3JiLnVpLlF1ZXJ5QnVpbGRlci5SdWxlcy5Cb29sZWFuID0gXy5leHRlbmQoe30sIGJvb2xfaW5wdXRzLCBudWxsX2lucHV0cyk7XG5cbiAgICBvcmIudWkuUXVlcnlCdWlsZGVyLlJ1bGVzLlN0cmluZyA9IF8uZXh0ZW5kKHt9LCBiYXNpY19pbnB1dHMsIG51bGxfaW5wdXRzLCB0ZXh0X2lucHV0cyk7XG4gICAgb3JiLnVpLlF1ZXJ5QnVpbGRlci5SdWxlcy5FbWFpbCA9IF8uZXh0ZW5kKHt9LCBiYXNpY19pbnB1dHMsIG51bGxfaW5wdXRzLCB0ZXh0X2lucHV0cyk7XG4gICAgb3JiLnVpLlF1ZXJ5QnVpbGRlci5SdWxlcy5UZXh0ID0gXy5leHRlbmQoe30sIGJhc2ljX2lucHV0cywgbnVsbF9pbnB1dHMsIHRleHRfaW5wdXRzKTtcbiAgICBvcmIudWkuUXVlcnlCdWlsZGVyLlJ1bGVzLkh0bWwgPSBfLmV4dGVuZCh7fSwgYmFzaWNfaW5wdXRzLCBudWxsX2lucHV0cywgdGV4dF9pbnB1dHMpO1xuICAgIG9yYi51aS5RdWVyeUJ1aWxkZXIuUnVsZXMuWG1sID0gXy5leHRlbmQoe30sIGJhc2ljX2lucHV0cywgbnVsbF9pbnB1dHMsIHRleHRfaW5wdXRzKTtcblxuICAgIG9yYi51aS5RdWVyeUJ1aWxkZXIuUnVsZXMuRGF0ZSA9IF8uZXh0ZW5kKHt9LCBkYXRlX2lucHV0cyk7XG4gICAgb3JiLnVpLlF1ZXJ5QnVpbGRlci5SdWxlcy5EYXRldGltZSA9IF8uZXh0ZW5kKHt9LCBkYXRlX2lucHV0cyk7XG4gICAgb3JiLnVpLlF1ZXJ5QnVpbGRlci5SdWxlcy5EYXRldGltZVdpdGhUaW1lem9uZSA9IF8uZXh0ZW5kKHt9LCBkYXRlX2lucHV0cyk7XG4gICAgXG4gICAgb3JiLnVpLlF1ZXJ5QnVpbGRlci5SdWxlcy5SZWZlcmVuY2UgPSBfLmV4dGVuZCh7fSwgcmVmX2lucHV0cywgbnVsbF9pbnB1dHMpO1xuXG59KSh3aW5kb3cub3JiKTsiLCIoZnVuY3Rpb24gKG9yYikge1xuICAgIG9yYi51aS5UYWJsZSA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcbiAgICAgICAgdGFnTmFtZTogJ2RpdicsXG4gICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgIGNsYXNzOiAndGFibGUgdGFibGUtc3RyaXBlZCBvcmItdGFibGUnXG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiBfLnRlbXBsYXRlKFxuICAgICAgICAgICAgJzx0YWJsZSBjbGFzcz1cInRhYmxlIHRhYmxlLXN0cmlwZWRcIj4nICtcbiAgICAgICAgICAgICAgICAnPCUgaWYgKHNob3dIZWFkZXIpIHsgJT4nICtcbiAgICAgICAgICAgICAgICAgICAgJzx0aGVhZD4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8dHI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzwlIF8uZWFjaChjb2x1bW5zLCBmdW5jdGlvbiAoY29sdW1uKSB7ICU+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8dGg+PCU9IGNvbHVtbi5kaXNwbGF5ICU+PC90aD4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPCUgfSk7ICU+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC90cj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzwvdGhlYWQ+JyArXG4gICAgICAgICAgICAgICAgJzwlIH0gJT4nICtcbiAgICAgICAgICAgICAgICAnPCUgaWYgKHNob3dGb290ZXIpIHsgJT4nICtcbiAgICAgICAgICAgICAgICAgICAgJzx0Zm9vdD4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8dHI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzwlIF8uZWFjaChjb2x1bW5zLCBmdW5jdGlvbiAoY29sdW1uKSB7ICU+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8dGg+PCU9IGNvbHVtbi5kaXNwbGF5ICU+PC90aD4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPCUgfSk7ICU+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC90cj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzwvdGZvb3Q+JyArXG4gICAgICAgICAgICAgICAgJzwlIH0gJT4nICtcbiAgICAgICAgICAgICAgICAnPHRib2R5PjwvdGJvZHk+JyArXG4gICAgICAgICAgICAnPC90YWJsZT4nXG4gICAgICAgICksXG4gICAgICAgIGNvbGxlY3REYXRhOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgb3V0cHV0ID0gW107XG4gICAgICAgICAgICB0aGlzLmNvbGxlY3Rpb24uZWFjaChmdW5jdGlvbiAobW9kZWwpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQucHVzaChtb2RlbC5hdHRyaWJ1dGVzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0Q29sdW1uczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIG91dHB1dCA9IFtdO1xuICAgICAgICAgICAgaWYgKHRoaXMuc2NoZW1hKSB7XG4gICAgICAgICAgICAgICAgXy5lYWNoKHRoaXMuc2NoZW1hLmNvbHVtbnMsIGZ1bmN0aW9uIChjb2x1bW4pIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogY29sdW1uLmZpZWxkLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogY29sdW1uLmRpc3BsYXlcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgICAgICB9LFxuICAgICAgICBnZXRDb2x1bW5EZWZzOiBmdW5jdGlvbiAoY29sdW1ucykge1xuICAgICAgICAgICAgdmFyIGRlZnMgPSBbXTtcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIF8uZWFjaChjb2x1bW5zLCBmdW5jdGlvbiAoY29sLCBpbmRleCkge1xuICAgICAgICAgICAgICAgIGlmIChjb2wucmVuZGVyZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlbmRlcmVyID0gY29sLnJlbmRlcmVyO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YU5hbWUgPSBjb2wuZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlbmRlcmVyT3B0aW9ucyA9IGNvbC5yZW5kZXJlck9wdGlvbnM7XG5cbiAgICAgICAgICAgICAgICAgICAgZGVmcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldHM6IGluZGV4LFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogZGF0YU5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICByZW5kZXI6IGZ1bmN0aW9uIChkYXRhLCB0eXBlLCBmdWxsLCBtZXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGUgPT09ICdkaXNwbGF5Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgd2lkZ2V0ID0gc2VsZltyZW5kZXJlcl0oZGF0YSwgdHlwZSwgZnVsbCwgbWV0YSwgcmVuZGVyZXJPcHRpb25zKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mKHdpZGdldCkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gd2lkZ2V0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlkID0gZGF0YU5hbWUgKyAnXycgKyBtZXRhLnJvdztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYucmVuZGVyZXJzW2lkXSA9IHdpZGdldDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnPHNwYW4gaWQ9XCInICsgaWQgKyAnXCIgY2xhc3M9XCJyZW5kZXJlci1jb250YWluZXIgd2FpdGluZ1wiPjwvc3Bhbj4nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkYXRhO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gZGVmcztcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0RXhwb3J0RGF0YTogZnVuY3Rpb24gKHJlY29yZCwgZmllbGQpIHtcbiAgICAgICAgICAgIHJldHVybiByZWNvcmQuYXR0cmlidXRlc1tmaWVsZF07XG4gICAgICAgIH0sXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuY29sbGVjdGlvbikge1xuICAgICAgICAgICAgICAgIHRoaXMuY29sbGVjdGlvbiA9IG9wdGlvbnMuY29sbGVjdGlvbjtcbiAgICAgICAgICAgICAgICB0aGlzLm1vZGVsVHlwZSA9IHRoaXMuY29sbGVjdGlvbi5tb2RlbDtcbiAgICAgICAgICAgICAgICB0aGlzLnNjaGVtYSA9IHRoaXMubW9kZWxUeXBlLnNjaGVtYTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG9wdGlvbnMubW9kZWxUeXBlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tb2RlbFR5cGUgPSBvcHRpb25zLm1vZGVsVHlwZTtcbiAgICAgICAgICAgICAgICB0aGlzLnNjaGVtYSA9IHRoaXMubW9kZWxUeXBlLnNjaGVtYTtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbGxlY3Rpb24gPSBvcHRpb25zLm1vZGVsVHlwZS5hbGwoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ0ludmFsaWQgcHJvcGVydGllcyB0byBUYWJsZSc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGRlZmluZSBwcm9wZXJ0aWVzXG4gICAgICAgICAgICB0aGlzLnRhYmxlID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgdGhpcy5yZW5kZXJlcnMgPSB7fTtcblxuICAgICAgICAgICAgLy8gZGVmaW5lIGNvbnRleHQgb3B0aW9uc1xuICAgICAgICAgICAgdGhpcy5jb2x1bW5zID0gb3B0aW9ucy5jb2x1bW5zIHx8IHRoaXMuZ2V0Q29sdW1ucygpO1xuICAgICAgICAgICAgdGhpcy5jb2x1bW5GaWx0ZXIgPSBvcHRpb25zLmNvbHVtbkZpbHRlciB8fCB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgIC8vIGRlZmluZSBkZWZhdWx0IG9wdGlvbnNcbiAgICAgICAgICAgIHRoaXMucGFnaW5hdGUgPSAob3B0aW9ucy5wYWdpbmF0ZSA9PT0gdW5kZWZpbmVkKSA/IHRydWUgOiBvcHRpb25zLnBhZ2luYXRlO1xuICAgICAgICAgICAgdGhpcy5zb3J0ID0gKG9wdGlvbnMuc29ydCA9PT0gdW5kZWZpbmVkKSA/IHRydWUgOiBvcHRpb25zLnNvcnQ7XG4gICAgICAgICAgICB0aGlzLmZpbHRlciA9IG9wdGlvbnMuZmlsdGVyIHx8IHRydWU7XG4gICAgICAgICAgICB0aGlzLnJvd0hlaWdodCA9IG9wdGlvbnMucm93SGVpZ2h0IHx8IDYwO1xuICAgICAgICAgICAgdGhpcy5tYXhWaXNpYmxlUm93cyA9IG9wdGlvbnMubWF4VmlzaWJsZVJvd3MgfHwgMTA7XG4gICAgICAgICAgICB0aGlzLm1heEhlaWdodCA9IG9wdGlvbnMubWF4SGVpZ2h0IHx8ICh0aGlzLnJvd0hlaWdodCAqIHRoaXMubWF4VmlzaWJsZVJvd3MpO1xuICAgICAgICAgICAgdGhpcy5zaG93SGVhZGVyID0gb3B0aW9ucy5zaG93SGVhZGVyIHx8IHRydWU7XG4gICAgICAgICAgICB0aGlzLnNob3dGb290ZXIgPSBvcHRpb25zLnNob3dGb290ZXIgfHwgZmFsc2U7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zLm9wdGlvbnMgfHwge307XG5cbiAgICAgICAgfSxcbiAgICAgICAgb25Sb3dSZW5kZXI6IGZ1bmN0aW9uIChyb3csIGRhdGEsIGluZGV4KSB7XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICAkKHJvdykuZmluZCgnLnJlbmRlcmVyLWNvbnRhaW5lci53YWl0aW5nJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyICRob2xkZXIgPSAkKHRoaXMpO1xuICAgICAgICAgICAgICAgICRob2xkZXIucmVtb3ZlQ2xhc3MoJ3dhaXRpbmcnKTtcblxuICAgICAgICAgICAgICAgIHZhciByZW5kZXJlciA9IHNlbGYucmVuZGVyZXJzWyRob2xkZXIuYXR0cignaWQnKV07XG5cbiAgICAgICAgICAgICAgICAvLyBhZGQgYSBqcXVlcnkgb2JqZWN0IGRpcmVjdGx5XG4gICAgICAgICAgICAgICAgaWYgKHJlbmRlcmVyIGluc3RhbmNlb2YgalF1ZXJ5KSB7XG4gICAgICAgICAgICAgICAgICAgICRob2xkZXIuYXBwZW5kKHJlbmRlcmVyKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyByZW5kZXIgYSBiYWNrYm9uZSB2aWV3XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlbmRlcmVyLnJlbmRlcigpO1xuICAgICAgICAgICAgICAgICAgICAkaG9sZGVyLmFwcGVuZChyZW5kZXJlci4kZWwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBvbkxvYWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIHZpcnR1YWwgbWV0aG9kXG4gICAgICAgIH0sXG4gICAgICAgIG9uUmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgICAgIC8vIHNldCB0aGUgZGVmYXVsdCBsb2FkZXIgZm9yIHRoaXMgdGFibGUgdG8gbG9hZCBjb2xsZWN0aW9uIGluZm9ybWF0aW9uXG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICAvLyBzY3JvbGxpbmcgb3B0aW9uc1xuICAgICAgICAgICAgICAgIHNjcm9sbFk6IHRoaXMubWF4SGVpZ2h0LFxuICAgICAgICAgICAgICAgIHNjcm9sbFg6IHRydWUsXG4gICAgICAgICAgICAgICAgc2Nyb2xsQ29sbGFwc2U6IHRydWUsXG4gICAgICAgICAgICAgICAgc3RhdGVTYXZlOiB0cnVlLFxuICAgICAgICAgICAgICAgIHByb2Nlc3Npbmc6IHRydWUsXG4gICAgICAgICAgICAgICAgbGVuZ3RoQ2hhbmdlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGZpbHRlcjogdGhpcy5maWx0ZXIsXG4gICAgICAgICAgICAgICAgaW5mbzogdHJ1ZSxcblxuICAgICAgICAgICAgICAgIGRlZmVyUmVuZGVyOiB0cnVlLFxuICAgICAgICAgICAgICAgIHNjcm9sbGVyOiB7XG4gICAgICAgICAgICAgICAgICAgIHJvd0hlaWdodDogdGhpcy5yb3dIZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXlCdWZmZXI6IDJcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgLy8gc2NoZW1hIGluZm9ybWF0aW9uXG4gICAgICAgICAgICAgICAgY29sdW1uczogdGhpcy5jb2x1bW5zLFxuICAgICAgICAgICAgICAgIGNvbHVtbkRlZnM6IHRoaXMuY29sdW1uRGVmcyxcblxuICAgICAgICAgICAgICAgIHBhZ2luYXRlOiB0aGlzLnBhZ2luYXRlLFxuICAgICAgICAgICAgICAgIHNvcnQ6IHRoaXMuc29ydCxcblxuICAgICAgICAgICAgICAgIGRvbTogJ1pUcnRpUycsXG5cbiAgICAgICAgICAgICAgICByb3dDYWxsYmFjazogZnVuY3Rpb24gKHJvdywgZGF0YSwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYub25Sb3dSZW5kZXIocm93LCBkYXRhLCBpbmRleCk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAvL2RyYXdDYWxsYmFjazogZnVuY3Rpb24gKHNldHRpbmdzKSB7XG4gICAgICAgICAgICAgICAgLy8gICAgdmFyIGFwaSA9IHRoaXMuYXBpKCk7XG4gICAgICAgICAgICAgICAgLy8gICAgdmFyIHJvd3MgPSBhcGkucm93cyh7cGFnZTogJ2N1cnJlbnQnfSkubm9kZXMoKTtcbiAgICAgICAgICAgICAgICAvLyAgICB2YXIgbGFzdCA9IG51bGw7XG4gICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAvLyAgICBhcGkuY29sdW1uKDEsIHtwYWdlOiAnY3VycmVudCd9KS5kYXRhKCkuZWFjaChmdW5jdGlvbiAoZ3JvdXAsIGkpIHtcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgaWYgKGxhc3QgIT09IGdyb3VwKSB7XG4gICAgICAgICAgICAgICAgLy8gICAgICAgICAgICAkKHJvd3MpLmVxKGkpLmJlZm9yZShcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICAgICAnPHRyIGNsYXNzPVwiZ3JvdXBcIj48dGQgY29sc3Bhbj1cIicgKyBzZWxmLmNvbHVtbnMubGVuZ3RoICsgJ1wiPicgKyBncm91cCArICc8L3RkPjwvdHI+J1xuICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgIGxhc3QgPSBncm91cDtcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vICAgIH0pO1xuICAgICAgICAgICAgICAgIC8vfSxcbiAgICAgICAgICAgICAgICBhamF4OiBmdW5jdGlvbiAoZGF0YSwgY2FsbGJhY2ssIHNldHRpbmdzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLmNvbGxlY3Rpb24uZmV0Y2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZmluaXNoZWQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdRdWVyeSB0b29rICcgKyAoZmluaXNoZWQgLSBzdGFydCkgKyAnbXMnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayh7ZGF0YTogc2VsZi5jb2xsZWN0RGF0YSgpfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5vbkxvYWQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyICR0YWJsZSA9IHRoaXMuJCgndGFibGUnKTtcblxuICAgICAgICAgICAgdGhpcy50YWJsZSA9ICR0YWJsZS5EYXRhVGFibGUoXy5leHRlbmQob3B0aW9ucywgc2VsZi5vcHRpb25zKSk7XG4gICAgICAgIH0sXG4gICAgICAgIHJlZnJlc2g6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMudGFibGUuYWpheC5yZWxvYWQoKTtcbiAgICAgICAgfSxcbiAgICAgICAgcm93Q291bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBpbmZvID0gdGhpcy50YWJsZS5wYWdlLmluZm8oKTtcbiAgICAgICAgICAgIHJldHVybiBpbmZvLnJlY29yZHNUb3RhbDtcbiAgICAgICAgfSxcbiAgICAgICAgc2VhcmNoOiBmdW5jdGlvbiAodGV4dCkge1xuICAgICAgICAgICAgdGhpcy50YWJsZS5zZWFyY2godGV4dCk7XG4gICAgICAgIH0sXG4gICAgICAgIHVuZmlsdGVyZWRSb3dDb3VudDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGluZm8gPSB0aGlzLnRhYmxlLnBhZ2UuaW5mbygpO1xuICAgICAgICAgICAgcmV0dXJuIGluZm8ucmVjb3Jkc0Rpc3BsYXk7XG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlSGVscGVyczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBjb2x1bW5zOiB0aGlzLmNvbHVtbnMsXG4gICAgICAgICAgICAgICAgc2hvd0hlYWRlcjogdGhpcy5zaG93SGVhZGVyLFxuICAgICAgICAgICAgICAgIHNob3dGb290ZXI6IHRoaXMuc2hvd0Zvb3RlclxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH0pO1xufSkod2luZG93Lm9yYik7XG4iXX0=
