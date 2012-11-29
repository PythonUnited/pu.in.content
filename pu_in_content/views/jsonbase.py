from django import http
from django.utils import simplejson as json
from django.template.loader import render_to_string
from django.views.generic.detail import BaseDetailView
from django.views.generic.edit import BaseCreateView, BaseUpdateView, \
     BaseDeleteView


class JSONResponseMixin(object):

    def get_html_template_name(self):

        """ Override this so as to return an actual html
        template. This will be added to the JSON data under the key of
        'html'.
        """

        return None

    def render_to_response(self, context):
        
        "Returns a JSON response containing 'context' as payload"

        return self.get_json_response(self.convert_context_to_json(context))

    def get_json_response(self, content, **httpresponse_kwargs):

        "Construct an `HttpResponse` object."

        return http.HttpResponse(content,
                                 content_type='application/json',
                                 **httpresponse_kwargs)

    def convert_context_to_json(self, context):

        "Convert the context dictionary into a JSON object. Override per view"

        raise NotImplementedError


class JSONUpdateView(JSONResponseMixin, BaseUpdateView):

    def form_valid(self, form):

        self.object = form.save()
        return self.render_to_response(self.get_context_data(form=form))

    def get_form(self, form_class):

        """
        Return the form, existing data merged with POST, so as to
        allow single field updates.
        """

        data = http.QueryDict("", mutable=True)

        self.object = self.get_object()

        for field in form_class._meta.fields:
            try:
                modelfield = self.object.__class__._meta.get_field(field)
                data[field] = modelfield.value_from_object(self.object)
            except:
                pass

        data.update(self.request.POST)

        return form_class(data=data, instance=self.object)

    def convert_context_to_json(self, context):

        if self.request.method == "GET":
            context['action'] = self.request.path
            if "field" in self.request.GET.keys():
                context['field'] = \
                    context['form'][self.request.GET['field']]
                data = {'html': 
                        render_to_string("snippets/singlefieldform.html", 
                                         context)}
            else:
                data = {'html': render_to_string("snippets/addform.html", 
                                                 context)}
        else:
            data = {'status': 0, 'errors': {}, 'html': ""}

            if not context['form'].is_valid():
                data['status'] = -1
                data['errors'] = context['form'].errors
                context['action'] = self.request.path
                data['html'] = render_to_string("snippets/addform.html", 
                                                context)
            else:

                if self.get_html_template_name():
                    data['html'] = render_to_string(
                        self.get_html_template_name(), context)
                elif "field" in self.request.POST.keys():
                    data['html'] = context['form'].cleaned_data[self.request.POST['field']]

        return json.dumps(data)


class JSONCreateView(JSONResponseMixin, BaseCreateView): 

    def form_valid(self, form):

        self.object = form.save()
        return self.render_to_response(self.get_context_data(form=form))

    def convert_context_to_json(self, context):

        if self.request.method == "GET":
            context['action'] = self.request.path
            data = {'html': render_to_string("snippets/editform.html", context)}
        else:
            data = {'status': 0, 'errors': {}, 'html': ""}

            if not context['form'].is_valid():
                data['status'] = -1
                data['errors'] = context['form'].errors
                context['action'] = self.request.path
                data['html'] = render_to_string("snippets/editform.html", context)
            elif self.get_html_template_name():
                data['html'] = render_to_string(
                    self.get_html_template_name(), context)

        return json.dumps(data)


class JSONDetailView(JSONResponseMixin, BaseDetailView):

    def convert_context_to_json(self, context):

        data = {}
        
        for field in self.object.__class__._meta.fields:
            data[field.name] = \
                   field.value_from_object(self.object)

        if self.get_html_template_name():
            data['html'] = render_to_string(
                self.get_html_template_name(), context)

        return json.dumps(data)


class JSONDeleteView(JSONResponseMixin, BaseDeleteView):

    def convert_context_to_json(self, context):

        data = {'status': 0, 'errors': {}}

        if self.get_html_template_name():
            data['html'] = render_to_string(
                self.get_html_template_name(), context)

        return json.dumps(data)

    def post(self, *args, **kwargs):

        self.object = self.get_object()
        self.object.delete()

        context = self.get_context_data(**kwargs)

        return self.render_to_response(context)
