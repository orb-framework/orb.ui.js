if (window.Marionette) {
    (function (orb, Marionette, $) {
        orb.ui.QueryItem = Marionette.ItemView.extend({
            tagName: 'li',
            model: orb.Query,
            template: _.template(
                '<div class="form-group">' +
                    '<div class="input-group">' +
                        '<div class="input-group-btn">' +
                            '<button class="btn btn-default remove-btn"><strong>&times;</strong></button>' +
                        '</div>' +
                        '<input class="form-control" value="<%- column %>"/>' +
                    '</div>' +
                    '<select class="form-control" value="<%- op %>">' +
                        '<option>Is</option>' +
                        '<option>Is not</option>' +
                    '</select>' +
                    '<span id="editor">' +
                        '<input class="form-control" value="<%- value %>"/>' +
                    '</span>' +
                    '<div class="btn-group">' +
                        '<div class="btn btn-default op-btn" data-op="And">And</div>' +
                        '<div class="btn btn-default op-btn" data-op="Or">Or</div>' +
                    '</div>' +
                '</div>'
            ),
            events: {
                'click .remove-btn': 'triggerRemove',
                'click .op-btn': 'triggerOpSwitch',
                'click .op-btn': 'triggerOpSwitch'
            },
            triggerRemove: function () {
                this.trigger('action:removed');
            },
            triggerOpSwitch: function (event) {
                var op = $(event.target).data('op');
                this.trigger('action:op-switched', op);
            }
        });

        orb.ui.QueryCompoundItem = Marionette.ItemView.extend({
            tagName: 'li',
            model: orb.QueryCompound,
            template: _.template(
                '<div class="form-group">' +
                    '<button class="btn btn-xs"><i class="fa fa-remove"></i></button>' +
                    '<span><em>Compound</em></span>' +
                    '<button class="btn btn-xs"><i class="fa fa-arrow-right"></i></button>' +
                '</div>'
            )
        });

        orb.ui.QueryBuilder = Marionette.CompositeView.extend({
            tagName: 'div',
            attributes: {
                class: 'query-builder form form-inline',
                role: 'form'
            },
            childView: function (item) {
                if (item.model instanceof orb.Q) {
                    return new orb.ui.QueryItem(item);
                } else {
                    return new orb.ui.QueryCompoundItem(item);
                }
            },
            childViewContainer: '#query-items',
            childEvents: {
                'action:op-switched': 'switchOp',
                'action:removed': 'removeQuery'
            },
            template: _.template(
                '<ul id="query-items" class="list-unstyled"></ul>'
            ),
            initialize: function (options) {
                options = options || {};
                this.schema = options.schema;
            },
            removeQuery: function (query) {
                if (this.collection.length > 1) {
                    this.collection.remove(query.model);
                }
            },
            switchOp: function (op) {
                this.collection.add(new orb.Q());
            }
        })
    })(window.orb, window.Marionette, $);
}