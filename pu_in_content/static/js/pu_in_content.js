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
 * target.
 * @param tgt Target link.
 */
pu_in.content.edit_inline = function(tgt) {

  var editable = null;
  
  if (tgt.attr("target")) {
    editable = $(tgt.attr("target"));
  } else {
    editable = tgt.parents(".editable").eq(0);
  }

  if (tgt.attr("href").startsWith("#")) {
    $(tgt.attr("href")).show();
  } else {
    $.get(tgt.attr("href"), function(data) {

        $("#MyModal .modal-body").html(data['html']);
        $("#MyModal").modal();

        var form = $("#MyModal").find('form').eq(0);

        form.submit(function() {
            return pu_in.content._handle_edit_submit(form, editable);
          })
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

  var add_to = $(tgt.attr("target"));

  if (tgt.attr("href").startsWith("#")) {
    $(tgt.attr("href")).show();
  } else {
    $.get(tgt.attr("href"), function(data) {
        $("#MyModal .modal-body").html(data['html']);
        $("#MyModal").modal();
        var form = $("#MyModal").find('form').eq(0);

        form.submit(function() {
            return pu_in.content._handle_add_submit(form, add_to);
          })
      });
  }
};


/**
 * Handle submission of the add form. Rebind submit to self.
 * @param form Form to submit
 * @param add_to Element to add reult to
 */
pu_in.content._handle_add_submit = function(form, add_to) {

  $.post(form.attr("action"),
         form.serialize(),
         function(data) {
           if (data['status'] != 0) {
             $("#MyModal .modal-body").html(data['html']);
             var form = $("#MyModal").find('form').eq(0);
             form.submit(function() {
                 return pu_in.content._handle_add_submit(form, add_to);
               });
           } else {
             add_to.append(data['html']);
             $("#MyModal").modal('hide');                       
           }
         });
  
  return false;
};


/**
 * Handle submission of the edit form. Rebind submit to self.
 * @param form Form to submit
 * @param replace Element to replace
 */
pu_in.content._handle_edit_submit = function(form, replace) {

  $.post(form.attr("action"),
         form.serialize(),
         function(data) {
           if (data['status'] != 0) {
             $("#MyModal .modal-body").html(data['html']);
             var form = $("#MyModal").find('form').eq(0);
             form.submit(function() {
                 return pu_in.content._handle_edit_submit(form, replace);
               });
           } else {
             replace.replaceWith(data['html']);
             $("#MyModal").modal('hide');                       
           }
         });
  
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
          if (tgt.attr("pu-confirm") == "true") {
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
