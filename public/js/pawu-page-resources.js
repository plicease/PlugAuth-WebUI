$(document).ready(function ()
{
  var page = new PlugAuth.UI.Page('resources', 'accounts', 'grant');
  page.select = function()
  {
    $('#plugauth_webui_toolbar').html('<form class="navbar-form pull-left">'
    +                                   '<input type="text" class="span2" placeholder="Search" id="plugauth_webui_resource_search">'
    +                                   '</form><form class="navbar-form pull-left">'
    +                                   '<button class="btn" id="plugauth_webui_resource_grant_button">Grant</button>'
    +                                   '</form>');
    
    // setup search
    (function() {
      var input = $('#plugauth_webui_resource_search');
      var search = function() {
        var search_text = input.val();
        $('#plugauth_webui_granted_table tbody tr').each(function(index,row) {
          if(search_text == ''
          || row.cells[0].innerHTML.indexOf(search_text) != -1
          || row.cells[1].innerHTML.indexOf(search_text) != -1
          || row.cells[2].innerHTML.indexOf(search_text) != -1)
          {
            row.style.display = 'table-row';
          }
          else
          {
            row.style.display = 'none';
          }
        });
      };
      input.change(search);
      PlugAuth.UI.bind_enter(input, search);
    })();
    
    // setup grant
    (function() {
      var modal = new PlugAuth.UI.Modal('Grant');
      modal.html('<form>'
      +          '<input type="text" class="span3" placeholder="resource"   id="plugauth_webui_grant_resource" /><br />'
      +          '<input type="text" class="span3" placeholder="action"     id="plugauth_webui_grant_action"   data-provide="typeahead" /><br />'
      +          '<input type="text" class="span3" placeholder="user/group" id="plugauth_webui_grant_group"    /><br />'
      +          '</form>');

      var resource = $('#plugauth_webui_grant_resource');
      var action   = $('#plugauth_webui_grant_action');
      var group    = $('#plugauth_webui_grant_group');
      
      modal.on('show', function() {
        resource.val('');
        action.val('');
        page.client.actions()
          // TODO: this works for tab completion, but what I really wanted
          // to see was a drop down for the suggestions.  Seems to work in
          // other examples I have seen, but something amiss here.
          .success(function(data) {
            action.typeahead({ source: data.sort() });
          });
        group.val('');
      });

      modal.on('shown', function() {
        resource.focus();
      });
      
      var grant = function()
      {
        modal.hide();
        page.client.grant(group.val(), action.val(), resource.val())
          .success(function() {
            // FIXME: add revoke button at the end here.
            $('#plugauth_webui_granted_table tbody').prepend('<tr><td>' + resource.val() 
            +                                                '</td><td>' + action.val() 
            +                                                '</td><td>' + group.val() 
            +                                                '</td><td></td></tr>');
          })
          .error(function() {
            PlugAuth.UI.error_modal.html('<p>Unable to grant permission</p>');
            PlugAuth.UI.error_modal.show();
          });
      }
      
      PlugAuth.UI.bind_enter(resource, function() { action.focus() });
      PlugAuth.UI.bind_enter(action,   function() { group.focus()  });
      PlugAuth.UI.bind_enter(group,    function() { grant()        });
      
      modal.add_button('Grant', 'btn-primary').click(function() { grant() });
      
      $('#plugauth_webui_resource_grant_button').click(function() {
        modal.show();
        return false;
      });
    })();
  
    $('#plugauth_webui_container').html('<table id="plugauth_webui_granted_table" class="table table-striped"><thead></thead><tbody></tbody></table>');
    $('#plugauth_webui_granted_table thead').html('<tr><th>resource</th><th>action</th><th>user/group</th><th>control</th></tr>');
    page.client.granted()
      .error(function(){
        PlugAuth.UI.error_modal.html('<p>Unable to retrieve grant list</p>');
        PlugAuth.UI.error_modal.show();
      })
      .success(function(data){
        $.each(data, function(index, value) {
          var match = value.match(/^(.*) \((.*)\): (.*)$/);
          if(match)
          {
            var group_list = match[3].split(',');
            $.each(group_list, function(index, group) {
              $('#plugauth_webui_granted_table tbody').append('<tr>' 
              +                                               '<td>' + match[1] + '</td>'
              +                                               '<td>' + match[2] + '</td>'
              +                                               '<td>' + group.replace(/^\s+/,'').replace(/\s+$/,'') + '</td>'
              +                                               '<td><button class="btn btn-danger">Revoke</button></td>'
              +                                               '</tr>');
            });
          }
        });
        $('#plugauth_webui_granted_table tbody tr td button').click(function() {
          var row = this.parentNode.parentNode;
          var resource = row.cells[0].innerHTML;
          var action   = row.cells[1].innerHTML;
          var group    = row.cells[2].innerHTML;
          page.client.revoke(group, action, resource)
            .error(function() {
              PlugAuth.UI.error_modal.html('<p>Unable to revoke permission</p>');
              PlugAuth.UI.error_modal.show();
            })
            .success(function() {
              // FIXME: remove row from table.
              alert('okay');
            });
        });
      });
  }
  page.order = 30;

});
