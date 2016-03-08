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