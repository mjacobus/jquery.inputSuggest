(function( $ ){
    $.fn.inputSuggest = function(options) {

        var settings = {
            url: window.location.href,
            method: 'POST',
            cache: false,
            async: false,
            stickToTheList: true,
            minChars: 3,
            /**
             * Handles the suggetstions
             * @param suggestions the ajax response. A json object
             * @param list the list to append the items
             * @param input the typing input
             */
            handleSuggestions: function(suggestions,list,input) {
                list.html('');
                for(var i=0; i < suggestions.length; i++) {
                    var item = settings.getItem(suggestions[i],input);
                    list.append(item);
                }
            },
            /**
             * Creates and returns an item based on one item of the response
             * @param   suggestion is the array element containing the object
             *          with the necessary information to create the item
             * @param   input where the suggestion is acting on
             *
             */
            getItem : function(suggestion, input) {
                var value = suggestion.value;
                var bolded = value.replace(input.val(),'<strong>' + input.val() + '</strong>')
                var li = $('<li title="'+value+'">'+bolded+'</li>');
                return li;
            },
            /**
             * Handles item click
             * @param selected li element being clicked
             * @param input the typing input
             * @param list the list to append the items
             */
            onSelect: function (selected,input,list) {
                input.val(selected.attr('title'));
                selected.removeClass('active');
                list.hide();
            },
            /**
             * Handles item mouse over
             * @param overed li element being clicked
             * @param list the list to append the items
             * @param input the typing input
             */
            onMouseOver: function (overed,input,list) {
                $('#' + list.attr('id') + ' li').removeClass('active');
                overed.addClass('active');
            },
            /**
             * Handles input blur
             * @param input the imput the suggestion is actin on
             */
            onBlur: function(input) {
                var value = input.val();
                var list = $('#' + input.attr('id') + '-suggest' )
                var valid = false;
                list.hide();

                if (list.length === 1) {
                    list.children('li').each(function(){
                        if ($(this).attr('title') === value) {
                            valid = true;
                            return;
                        }
                    }).each(function(){
                        if ($(this).hasClass('active')) {
                            settings.onSelect($(this),input,list);
                            valid = true;
                            return;
                        }
                    }).removeClass('active');
                }
                if (this.stickToTheList && !valid) {
                    input.val('');
                }
            }
        };

        if (options) {
            $.extend( settings, options );
        }

        this.each(function(){

            $(this).attr('autocomplete','off');
            $(this).keyup(function(e){

                var url = settings.url;
                var inputName = $(this).attr('name');
                var listId = inputName + '-suggest';
                var listSelector = '#' + listId;
                var $input = $(this);
                var value = $input.val();

                /**
                 * Navigation keys
                 * keys: arrow up, arrow down
                 */
                if(e.keyCode == 38 || e.keyCode ==40) {
                    var $current = $(listSelector + ' li.active');
                    if ($current.length == 0) {
                        $(listSelector + ' li:first').addClass('active');
                        return;
                    }
                    if (e.keyCode == 38) { //up key
                        var $prev = $current.prev('li');
                        if($prev.length === 1) {
                            $(listSelector + ' li').removeClass('active');
                            $prev.addClass('active');
                        }
                    } else if (e.keyCode == 40) { //down key
                        var $next = $current.next('li');
                        if($next.length === 1) {
                            $(listSelector + ' li').removeClass('active');
                            $next.addClass('active');
                        }
                    }
                    return
                } // navigation keys


                if (value.length < settings.minChars || $input.attr('lastval') == value) {
                    $input.attr('lastval',value);
                    return;
                }

                if ($(listSelector).length == 0) {
                    $('<ul id="' + listId + '" class="suggest"></ul>').appendTo($(this).parent());
                }

                var $list = $(listSelector);
                $list.html('').show().css({
                    width: $(this).width(),
                    'margin-left': $(this).css('margin-left')
                });

                $.ajax({
                    url: url,
                    type: settings.method,
                    cache: settings.cache,
                    asyc: settings.async,
                    data: {
                        hint:value
                    },
                    success: function(suggestions){
                        settings.handleSuggestions(suggestions,$list,$input);
                        $list.children('li').click(function(){
                            settings.onSelect($(this),$input,$list);
                        }).hover(function(){
                            settings.onMouseOver($(this),$input,$list);
                        });
                    }
                });
            });

            $(this).blur(function() {
                settings.onBlur($(this));
            });

            
        });//this.each
    }
})(jQuery)