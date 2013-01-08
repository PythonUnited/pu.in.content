/**
 * pu.in content library. This library takes care of frontend content
 * editing.
 */

// pu_in namespace
if (pu_in == undefined) {
  var pu_in = {};
}


// Our own namespace
pu_in['content'] = {};


/**
 * Remove the element that is the '.editable' parent of the event's
 * target.
 */
pu_in.content.remove_inline = function(tgt) {

  $.post(tgt.attr("href"),
         {},
         function(data) {           
           if (data['status'] != 0) {
             pg.showMessage(data['errors'], "error");
           } else {
             tgt.parents(".editable").eq(0).remove();
           }
         });
};


/**
 * Edit inline. If the href is a link to an id, show that id (assuming
 * it is the edit form), else fetch the link and show that in the
 * modal box.
 * @param tgt Target link.
 */
pu_in.content.edit_inline = function(tgt) {

  var target = null;
  var defaults = {};

  if (tgt.attr("target")) {
    target = $(tgt.attr("target"));
  } else {
    target = tgt.parents(".editable").eq(0);
    defaults['pu_targetbehavior'] = 'replace';
  }

  if (tgt.attr("href").startsWith("#")) {
    $(tgt.attr("href")).show();
  } else {
    $.get(tgt.attr("href"), function(data, status, xhr) {

        var contentType = pu_in.core.detectContentType(xhr);

        if (contentType.indexOf("json") > -1) {          
          $("#MyModal .modal-body").html(data['html']);
        } else {
          $("#MyModal .modal-body").html(data);
        }
        
        // Bind submit
        $("#MyModal").on("submit.pu_in_content", "form", function(e) {

            var form = $(e.target);

            $.post(form.attr("action"),
                   form.serialize(),
                   function(data, status, xhr) {
                     if (data['status'] != 0) {
                       $("#MyModal .modal-body").html(data['html']);
                     } else {
                       pu_in.core.handleResult(tgt, target, data, status, xhr, 
                                               defaults);
                       $("#MyModal").off("submit.pu_in_content", "form");
                       $("#MyModal").modal('hide');                       
                     }
                   });

            e.preventDefault();
            e.stopPropagation();
          });

        $("#MyModal").modal();
      });
  }

  editable.addClass("edit");
};


/**
 * Add inline. This involves either showing an existing add form, or
 * fetching it from remote.
 * @param tgt Target link.
 */
pu_in.content.add_inline = function(tgt) {

  var target = tgt.attr("target") ? $(tgt.attr("target")) : null;
  var defaults = {'pu_targetbehavior': 'append'};

  if (tgt.attr("href").startsWith("#")) {
    $(tgt.attr("href")).show();
  } else {
    $.get(tgt.attr("href"), function(data) {

        // todo : propert content type check
        
        $("#MyModal .modal-body").html(data['html']);

        $("#MyModal").on("submit.pu_in_content", "form", function(e) {

            var form = $(e.target);

            $.post(form.attr("action"),
                   form.serialize(),
                   function(data, status, xhr) {
                     if (data['status'] != 0) {
                       $("#MyModal .modal-body").html(data['html']);
                     } else {
                       pu_in.core.handleResult(tgt, target, data, status, xhr, 
                                               defaults);
                       $("#MyModal").off("submit.pu_in_content", "form");
                       $("#MyModal").modal('hide');
                     }
                   });

            e.preventDefault();
            e.stopPropagation();

          });
        $("#MyModal").modal('show');        
      });
  }
}


/**
 * Handle submission of the add form. Rebind submit to self.
 * @param form Form to submit
 * @param add_to Element to add reult to
 */
pu_in.content._handle_add_submit = function(link, form, add_to) {

  
  return false;
};


// Initialize pu_in.content
//
$(document).ready(function() {

    $(document).on("click", ".rm-inline", function(event) {

        var tgt = $(event.target);

        if (!tgt.hasClass("rm-inline")) {
          tgt = tgt.parents(".rm-inline");
        }

        if (tgt.hasClass("rm-inline")) {
          if (tgt.data("pu_confirmdelete")) {
            pg.confirmMessage("Weet je zeker dat je dit item wilt verwijderen?",

                              pu_in.content.remove_inline, [tgt]);
          } else {
            pu_in.content.remove_inline(tgt);
          }
        }
        event.preventDefault();        
      });

    $(document).on("click", ".edit-inline", function(event) {
        try {
          var tgt = $(event.target);

          if (!tgt.hasClass("edit-inline")) {
            tgt = tgt.parents(".edit-inline");
          }

          pu_in.content.edit_inline(tgt);
        } catch (e) {
          // pass
        }
        event.preventDefault();
      });

    $(document).on("click", ".add-inline", function(event) {
        try {
          var tgt = $(event.target);

          if (!tgt.hasClass("add-inline")) {
            tgt = tgt.parents(".add-inline");
          }

          pu_in.content.add_inline(tgt);
        } catch (e) {
          // pass
        }
        event.preventDefault();
      });
    
  });
