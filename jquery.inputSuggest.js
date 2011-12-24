(function( $ ){
    $.fn.inputSuggest = function(options) {
        var settings = {
            url: window.location.href,
            method: 'POST',
            cache: false,
            async: false,
            stickToTheList: true,
            minChars: 3,
            suggestionField: 'value',
            paramName: 'hint',
            /**
             * @param hint
             */
            getSuggestions: function(hint){
                return false;
            },
            /**
             * Handles the suggetstions
             * @param suggestions the ajax response. A json object
             * @param list the list to append the items
             * @param input the typing input
             */
            handleSuggestions: function(suggestions,list,input) {
                list.html('');
                for(var i in suggestions) {
                    var item = this.getItem(suggestions[i],input,list);
                    item = this.defaultPreAppend(item,suggestions[i],input,list);
                    item = this.preAppend(item,suggestions[i],input,list);
                    list.append(item);
                }
            },
            /**
             * @param suggestions
             */
            eval: function(suggestions){
                if(typeof(suggestions) === 'string'){
                    suggestions = eval('(' + suggestions + ')');
                }
                return suggestions; 
            },
            /**
             * Creates and returns an item based on one item of the response
             * @param   suggestion is the array element containing the object
             *          with the necessary information to create the item
             * @param   input where the suggestion is acting on
             * @param   list the list
             *
             */
            getItem : function(suggestion,input,list) {
                var li = $('<li></li>');
                var s=[];
                for(var i in suggestion){
                    s.push(['"',i,'":"',(suggestion[i]+"").replace(/"/g,'\\"'),'"'].join(''));
                }
                return li.attr('suggestion','({'+s.join(',')+'})');
            },
            /**
             * Gets the orinal suggestion
             * @param item
             */
            getSuggestion: function(item){
                return this.eval(item.attr('suggestion'));
            },
            /**
             * Get the regexp matcher for matching the hint
             * getMatcher("cão") => /(c|ç)(a|á|ã|à|ä|â)(o|ö|ó|õ|ò|ô)/i
             * @param string
             */
            getMatcher: function(string){
                var regexpString = string.replace('c','(c|ç)')
                .replace(/\s/g,'\\s')
                .replace('a','(a|á|ã|à|ä|â)')
                .replace('e','(e|é|ë|ẽ|è|ê)')
                .replace('i','(i|í|ï|ĩ|ì|î)')
                .replace('o','(o|ö|ó|õ|ò|ô)')
                .replace('u','(u|ü|ú|ũ|ù|û)');
                return new RegExp(regexpString,'i');
            },
            /**
             * Execute after getting item
             * @param   item just created li element
             * @param   suggestion the response element
             * @param   input the input
             * @param   list the list
             */
            defaultPreAppend : function(item, suggestion, input,list) {
                var value = this.getValue(suggestion);
                var regexp = this.getMatcher(input.val());
                var matches = value.match(regexp);
                if (matches !== null){
                    var bolded = value.replace(regexp,'<strong>' + matches[0] + '</strong>');
                    item.attr('title',value).html(bolded);
                } else {
                    item.attr('title',value).html(value);
                }
                return item;
            },
            getValue: function(suggestion){
                return suggestion[this.suggestionField];
            },
            /**
             * Execute after getting item
             * @param   item just created li element
             * @param   suggestion the response element
             * @param   input the input
             * @param   list the list
             */
            preAppend : function(item, suggestion, input,list) {
                return item;
            },
            /**
             * Handles item select
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
             * Pre select
             * @param selected li element being clicked
             * @param input the typing input
             * @param list the list to append the items
             */
            preSelect: function (selected,input,list) {},
            /**
             * Pre select
             * @param selected li element being clicked
             * @param input the typing input
             * @param list the list to append the items
             */
            postSelect: function (selected,input,list) {},
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
             * Handles the clearing of aditional elements when 
             * stickToTheList is true
             * @param input the typing input
             * @param list the list to append the items
             */
            onClear : function(input, list){
                input.val('');
            },
            getListId: function (input){
                return (input.attr('name') + '_suggest').replace(/[\[\]]/g,'_');
            },
            /**
             * Handles input blur
             * @param input the imput the suggestion is actin on
             */
            onBlur: function(input) {
                var value = input.val();
                var list = $('#' + this.getListId(input));
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
                            settings.preSelect($(this),input,list);
                            settings.onSelect($(this),input,list);
                            settings.postSelect($(this),input,list);
                            valid = true;
                            return;
                        }
                    }).removeClass('active');
                }
                if (this.stickToTheList && !valid) {
                    settings.onClear(input,list);
                }
            },
            /**
             * What should be done after the escape key is pressed?
             * @param input the input
             * @param list the list
             */
            onEscape: function(input,list){
                input.val('');
                list.remove();
            },
            /**
             * What should be done after the onEscape method
             * @param input the input
             * @param list the list
             */
            onAfterEscape: function(input,list){}
        };

        if (options) {
            $.extend( settings, options );
        }

        this.each(function(){
            $(this).attr('autocomplete','off');
            $(this).keyup(function(e){
                var listId = settings.getListId($(this));
                var listSelector = '#' + listId;
                var input = $(this);
                var value = input.val();
                var list = $(listSelector);
                /**
                 * Navigation keys
                 * keys: arrow up, arrow down, escape
                 */
                if(e.keyCode == 38 || e.keyCode ==40 || e.keyCode ==27) {
                    if(e.keyCode===27){//escape
                        settings.onEscape(input,list);
                        settings.onAfterEscape(input,list);
                        return;
                    }
                    var current = $(listSelector + ' li.active');
                    if (current.length === 0) {
                        $(listSelector + ' li:first').addClass('active');
                        return;
                    }
                    if (e.keyCode == 38) { //up key
                        var prev = current.prev('li');
                        if(prev.length === 1) {
                            $(listSelector + ' li').removeClass('active');
                            prev.addClass('active');
                        }
                    } else if (e.keyCode == 40) { //down key
                        var next = current.next('li');
                        if(next.length === 1) {
                            $(listSelector + ' li').removeClass('active');
                            next.addClass('active');
                        }
                    }
                    return
                } // navigation keys

                // i don't remember what that does
                if (value.length < settings.minChars || input.attr('lastval') == value) {
                    input.attr('lastval',value);
                    return;
                }

                if ($(listSelector).length === 0) {
                    $('<ul id="' + listId + '" class="suggest"></ul>').appendTo($(this).parent());
                }

                list.html('').show().css({
                    width: $(this).width(),
                    'margin-left': $(this).css('margin-left'),
                    'margin-top': '-1px'
                });

                var handler = function(suggestions){
                    if(typeof(suggestions) == 'string') {
                        suggestions = settings.eval(suggestions)
                    }
                    settings.handleSuggestions(suggestions,list,input);
                    list.children('li').click(function(){
                        settings.onSelect($(this),input,list);
                        settings.postSelect($(this),input,list);
                    }).hover(function(){
                        settings.onMouseOver($(this),input,list);
                    });
                }
                
                var suggested = settings.getSuggestions(value);
                
                if(suggested === false) {
                    var url = settings.url;
                    var data = {};
                    data[settings.paramName] = value;
                    $.ajax({
                        url: url,
                        type: settings.method,
                        cache: settings.cache,
                        asyc: settings.async,
                        data: data,
                        success: handler
                    });
                } else {
                    handler(suggested);
                }
                 
                
            });

            $(this).blur(function() {
                settings.onBlur($(this));
            });
        });//this.each
    }
})(jQuery)