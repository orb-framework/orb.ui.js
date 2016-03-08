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