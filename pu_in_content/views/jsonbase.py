from django.http import QueryDict
from django.template.loader import render_to_string
from django.views.generic.detail import BaseDetailView
from django.views.generic.edit import BaseCreateView, BaseUpdateView, \
     BaseDeleteView
from pu_in_core.views.jsonbase import JSONResponseMixin, JSONFormMixin
from pu_in_content.utils import value_to_html
from django.utils.safestring import mark_safe


class JSONUpdateView(JSONFormMixin, BaseUpdateView):

    def get_form(self, form_class):

        """
        Return the form, existing data merged with POST, so as to
        allow single field updates.
        """

        data = QueryDict("", mutable=True)

        self.object = self.get_object()

        for field in form_class.base_fields.keys():
            try:
                modelfield = self.object.__class__._meta.get_field(field)
                data[field] = modelfield.value_from_object(self.object)
            except:
                pass

        data.update(self.request.POST)

        return form_class(data=data, instance=self.object)

    @property
    def template_name(self):

        if "field" in self.request.REQUEST.keys():
            return "snippets/singlefieldform.html"
        else:
            return "snippets/editform.html"

    def get_context_data(self, **kwargs):

        context = super(JSONUpdateView, self).get_context_data(**kwargs)

        if "field" in self.request.REQUEST.keys():

            context['field'] = context['form'][self.request.REQUEST['field']]
            context['field_value'] = mark_safe(value_to_html(context['field']))

        if self.request.method == "POST" and not context['form'].is_valid():
            context['status'] = -1
            context['errors'] = context['form'].errors
        else:
            context['status'] = 0
            context['errors'] = ""

        return context


class JSONCreateView(JSONFormMixin, BaseCreateView): 

    template_name = "snippets/addform.html"

    def get_context_data(self, **kwargs):

        context = super(JSONCreateView, self).get_context_data(**kwargs)

        if self.request.method == "POST":

            if not context['form'].is_valid():
                context['status'] = -1
                context['errors'] = context['form'].errors
            else:
                context['status'] = 0
                context['errors'] = ""

        return context


class JSONDetailView(JSONResponseMixin, BaseDetailView):

    def get_context_data(self, **kwargs):

        data = {}
        
        for field in self.object.__class__._meta.fields:
            data[field.name] = \
                   field.value_from_object(self.object)

        return data


class JSONDeleteView(JSONResponseMixin, BaseDeleteView):

    def get_context_data(self, **kwargs):

        return {'status': 0, 'errors': {}}

    def post(self, *args, **kwargs):

        self.object = self.get_object()
        self.object.delete()

        context = self.get_context_data(**kwargs)

        return self.render_to_response(context)
