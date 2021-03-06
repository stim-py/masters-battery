/*Tuuli Pöllänen, August 2014:  
 *  
 *  This is a modification of Josh Deleeuw's XAB trial plugin so that it presents two stimuli simultaneously and
 *  then prompts for a response as the outcome of comparing those two images. The correct response should
 *  be stored as a value in the trial data object that is passed to the plugin, because it's used in
 *  the resp function to store a binary value of whether the response was correct or false.
 * 
 *  Please note that while this plugin is entirely useable, it has unused parameters left over from the XAB
 *  plugin and a number of pitfalls I haven't considered because it works just fine for my current purpose.
 */

(function($) {
    jsPsych["two-stim"] = (function() {

        var plugin = {};

        plugin.create = function(params) {

            // the number of trials is determined by how many entries the params.stimuli array has
            var trials = new Array(params.stimuli.length);

            for (var i = 0; i < trials.length; i++) {
                trials[i] = {};
                trials[i].type = "two-stim";
                trials[i].a_path = params.stimuli[i][0];
                trials[i].b_path = params.stimuli[i][1];
                trials[i].correct_key = params.data[i].correct_key;
                trials[i].left_key = (typeof params.left_key === 'undefined') ? 81 : params.left_key;
                trials[i].right_key = (typeof params.right_key === 'undefined') ? 80 : params.left_key;
                // timing parameters
                trials[i].feedback_duration = (typeof params.feedback_duration === 'undefined') ? 0 : params.feedback_duration;
                trials[i].timing_ab = params.timing_ab || -1; // defaults to -1, meaning infinite time on AB. If a positive number is used, then AB will only be displayed for that length.
                trials[i].timing_post_trial = (typeof params.timing_post_trial === 'undefined') ? 1000 : params.timing_post_trial; // defaults to 1000msec.
                // optional parameters
                trials[i].false_feedback = (typeof params.false_feedback === 'undefined') ? "" : params.false_feedback;
                trials[i].correct_feedback = (typeof params.correct_feedback === 'undefined') ? "" : params.correct_feedback;
                trials[i].is_html = (typeof params.is_html === 'undefined') ? false : params.is_html;
                trials[i].prompt = (typeof params.prompt === 'undefined') ? "" : params.prompt;
                trials[i].data = (typeof params.data === 'undefined') ? {} : params.data[i];
                trials[i].training = (typeof params.data === 'undefined') ? false : params.training;

            }
            return trials;
        };

        var xab_trial_complete = false;

        plugin.trial = function(display_element, block, trial) {

            var enabled = true;

                // randomize whether the target is on the left or the right
                var images = [trial.a_path, trial.b_path];
                var target_left = (Math.floor(Math.random() * 2) === 0); // 50% chance target is on left.
                if (!target_left) {
                    images = [trial.b_path, trial.a_path];
                }

                // show the options
                display_element.append($("<div id = 'stim_container'>"));
                if (!trial.is_html) {
                    $("#stim_container").append($('<img>', {
                        "src": images[0],
                        "class": 'jspsych-two-stim-stimulus'
                    }));
                    $("#stim_container").append($('<img>', {
                        "src": images[1],
                        "class": 'jspsych-two-stim-stimulus'
                    }));

                }
                else {
                    $("#stim_container").append($('<div>', {
                        "class": 'jspsych-two-stim-stimulus',
                        html: images[0]
                    }));
                    $("#stim_container").append($('<div>', {
                        "class": 'jspsych-two-stim-stimulus',
                        html: images[1]
                    }));
                }

                if (trial.prompt !== "") {
                    display_element.append($("<p class = 'centered prompt'>"+trial.prompt+"</p>"));
                }

                // start measuring response time
                var startTime = (new Date()).getTime();

                // if timing_ab is > 0, then we hide the stimuli after timing_ab milliseconds
                if (trial.timing_ab > 0) {
                    setTimeout(function() {
                        if (!xab_trial_complete) {
                            $('.jspsych-two-stim-stimulus').css('visibility', 'hidden');
                        }
                    }, trial.timing_ab);
                }
                
                var feedback_func = function(correct) {
                    if (correct === true) {
                        //$(".prompt").replaceWith("<p class = 'centered correct'>" + trial.correct_feedback + "</p>");
                        $(".prompt").replaceWith(
                            $('<p>', {
                                class: 'centered correct',
                                text: trial.correct_feedback
                            })); 
                    }
                    else {
                        $(".prompt").replaceWith(
                            $('<p>', {
                                class: 'centered false',
                                text: trial.false_feedback
                            }));
                    }
                }

                var finish_func = function() {
                    // move on to the next trial after timing_post_trial milliseconds
                    if(trial.timing_post_trial > 0) {
                        setTimeout(function() {
                            enabled = true;
                            block.next();
                        }, trial.timing_post_trial);
                    } else {
                        enabled = true;
                        block.next();
                        }
                    $(document).unbind('keydown', resp_func); // remove response function from keys
                    display_element.html(''); // remove all
                    xab_trial_complete = true;
                }

                // create the function that triggers when a key is pressed.
                var resp_func = function(e) {
                    if (!enabled) {
                        return;
                    }
                    var endTime = (new Date()).getTime();
                    var rt = (endTime - startTime);
                    var flag = false; // true when a valid key is chosen
                    var correct = false; // true when the correct response is chosen

                    if (e.which === trial.left_key || e.which === trial.right_key) {
                        flag = true;
                        enabled = false;
                            if (e.which == trial.correct_key) {
                            correct = true;
                        }

                        var trial_data = {
                            "training" : trial.training,
                            "trial_type": "two-stim",
                            "trial_index": block.trial_idx,
                            "rt": rt,
                            "correct": correct,
                            "key_press": e.which
                        };

                        feedback_func(correct);
                        block.writeData($.extend({}, trial_data, trial.data));

                        setTimeout(function() {
                            finish_func();
                        }, trial.feedback_duration);
                    }
                };
                //do this as a callback to setTimeout()?
                //problem: both finish_func and resp_func that calls it contain setTimeout
                $(document).keydown(resp_func);
        };
        return plugin;
    })();
})(jQuery);
