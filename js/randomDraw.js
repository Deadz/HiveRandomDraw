// SET
	// INIT.VAR
		hive.api.setOptions({ url: 'https://anyx.io' });
		hive.config.set('address_prefix','STM');
		hive.config.set('chain_id','beeab0de00000000000000000000000000000000000000000000000000000000');
		hive.config.set('alternative_api_endpoints', ['https://api.hive.blog', 'https://anyx.io']);

		var vote_participant = [];
		var coms_participant = [];
		var participants = [];
		var win_list = [];
		var bots_list = [];
		var number_of_draws = "1";
		var reset = $("#winner").html();
		$.ajax(
		{
			url: './blacklist/bots.json',
			dataType: 'json',
			success: function(d)
			{
				bots_list = d.bots;
			}
		});
	// END INIT.VAR

	// SET.VAL.SAVE
		$('#UpVoteSlider')[0].value = localStorage.vote_min;
		$("#coms_field").val(localStorage.coms_text);

		if(localStorage.repl_box == "false") $("#repl_box").prop('checked', false);
		else $("#repl_box").prop('checked', true);
		if(localStorage.coms_box == "false") $("#coms_box").prop('checked', false);
		else $("#coms_box").prop('checked', true);
		if(localStorage.vote_box == "false") $("#vote_box").prop('checked', false);
		else $("#vote_box").prop('checked', true);
		if(localStorage.bots_box == "false") $("#bots_box").prop('checked', false);
		else $("#bots_box").prop('checked', true);
		if(localStorage.dble_box == "false") $("#dble_box").prop('checked', false);
		else $("#dble_box").prop('checked', true);
	// END SET.VAL.SAVE
// END SET

// FUNCTION

// Cutting the link, retrieving the author and the permlink 
function getAuthorPermlink(link_full)
{
	return new Promise((resolve, reject) => 
	{
		//console.log("getInfoLink");		
		regex_v1 = new RegExp("/@");
		regex_v2 = new RegExp("/");

		if (regex_v1.test(link_full))
		{
			link_split = link_full.split(regex_v1)[1];
			sessionStorage.setItem("link_site", link_full.split(regex_v2)[0]+"//"+link_full.split(regex_v2)[2]);
			console.log(sessionStorage.link_site);
			sessionStorage.setItem("author", link_split.split(regex_v2)[0]);
			console.log(sessionStorage.author);
			sessionStorage.setItem("permlink", link_split.split(regex_v2)[1]);
			console.log(sessionStorage.permlink);
			resolve();
		}
		else
		{
			reject("Please, Provide a valid link like https://busy.org/fr/@deadzy/my-contribution");
		}
	})
}

// Retrieving the number of votes and comments
function getInfoBase()
{
	return new Promise((resolve, reject) => 
	{
		hive.api.getContent(sessionStorage.author, sessionStorage.permlink, function(err, result)
	  {
	  	if(err == null)
			{
				sessionStorage.setItem("vote_nb", result.active_votes.length); // Number of upvote
	  		sessionStorage.setItem("coms_nb", result.children); // Number of coms
	  		sessionStorage.setItem("childnb", result.children);
				resolve(result);
			}
			else
			{
				reject(err);
			}
	  });
	})
}

// Creation of the list of users who have voted and who correspond to the conditions
function getInfoVote() 
{
	return new Promise((resolve, reject) => 
	{
	    hive.api.getActiveVotes(sessionStorage.author, sessionStorage.permlink, function(err, result)
	    {
			//console.log("getVoteValid");

			if(err == null) 
			{
				vote_min = $('#UpVoteValue')[0].innerText*100;

				for (var i = 0; i < sessionStorage.vote_nb; i++)
				{
				    if(result[i].percent >= vote_min && result[i].voter != sessionStorage.author)
				    {
				    	if(!$("#dble_box").is(":checked")  && $.inArray(result[i].voter, win_list) >= 0) {} // Already win 
				    	else
				    	{
				    		if($("#bots_box").is(":checked") && $.inArray(result[i].voter, bots_list) >= 0) {} // Bot
				    		else
				    			vote_participant.push(result[i].voter); // Add list
				    	}
				    }
				}
				resolve();
			}
			else
			{
				reject(err);
			}
		});
  })
}


function getReplies(author, permlink)
{
	return new Promise((resolve, reject) => 
	{
	  hive.api.getContentReplies(author, permlink, function(err, result)
	  {
	  	if(err == null)
			{
				resolve(result);
			}
			else
			{
				reject(err);
			}
	  });
	})
}

// Creation of the list of users who have commented (and replied to comments), which correspond to the conditions
async function fetchReplies(author, permlink)
{
	reply = await getReplies(author, permlink);
	reply.forEach(function(element)
	{
	  // console.log(element);
	  sessionStorage.setItem("childnb", sessionStorage.childnb-1);
	  var regex =  new RegExp(localStorage.coms_text, "ig");
		if(regex.test(element.body) == true && element.author != sessionStorage.author)
		{
			if($.inArray(element.author, coms_participant) === -1) // Already in the list
			{
				if(!$("#dble_box").is(":checked") && $.inArray(element.author, win_list) >= 0) 
				{} // Already win
		    else
		    {
		    	if($("#bots_box").is(":checked") && $.inArray(element.author, bots_list) >= 0)
		    	{} // Bot
		    	else 
		    	{
		    		coms_participant.push(element.author); // Add list
		    	}
				}
			}
		}
	  if(element.children > 0)
	  {
	  	fetchReplies(element.author, element.permlink);
	  }
	  else
	  {
	  	if(sessionStorage.childnb == 0)
		  {
		  	getRandomDraw();
				getResult();
		  }
	  }
	});
}

// Creation of the list of users who have commented and who correspond to the conditions
function getInfoComs() 
{
	return new Promise((resolve, reject) => 
	{
		hive.api.getContentReplies(sessionStorage.author, sessionStorage.permlink, function(err, result)
		{
			//console.log("getComsValid");
			if(err == null)
			{
				coms_noReply = result.length; // Number of first com

				for(var i = 0; i < coms_noReply; i++)
				{
					var regex =  new RegExp(localStorage.coms_text, "ig");
					if(regex.test(result[i].body) == true && result[i].author != sessionStorage.author)
					{
						if(!$("#dble_box").is(":checked")  && $.inArray(result[i].author, win_list) >= 0) 
						{} // Already win
				    else
				    {
				    	if($("#bots_box").is(":checked") && $.inArray(result[i].author, bots_list) >= 0)
				    	{} // Bot
				    	else 
				    	{
				    		coms_participant.push(result[i].author); // Add list
				    	}
						}
					}
				}
				resolve();
			}
			else
			{
				reject(err);
			}
		});
	})
}

// Random number
function randomNumber(max)
{
	return Math.floor(Math.random()*(max));
}

// Random draw
function getRandomDraw()
{
	return new Promise((resolve, reject) => 
	{
		//console.log("getRandomDraw");

		if($("#coms_box").is(":checked") && $("#vote_box").is(":checked"))
		{
			if($('input[name=choi_field]:checked').val() == "or") // Vote or Coms
			{
				vote_participant.forEach(function(e)
				{
					participants = coms_participant;
					if($.inArray(e, coms_participant) === -1)
					{
						participants.push(e);
					}
				});
			}
			else // Vote and Coms
			{
				vote_participant.forEach(function(e)
				{
					if($.inArray(e, coms_participant) >= 0)
					{
						participants.push(e);
					}
				});
			}
			for (i = 0; i < participants.length; i++)
			{
				$("#tab").append("<tr><td>"+(i+1)+"</td><td>"+coms_participant[i]+"</td></tr>");
			}
			sessionStorage.setItem("nb_valid", participants.length);
			sessionStorage.setItem("winner", participants[randomNumber(participants.length)]);
			resolve();
		}
		else
		{
			if($("#coms_box").is(":checked")) // Only Coms
			{
				for (i = 0; i < coms_participant.length; i++)
				{
					$("#tab").append("<tr><td>"+(i+1)+"</td><td>"+coms_participant[i]+"</td></tr>");
				}
				sessionStorage.setItem("nb_valid", coms_participant.length);
				sessionStorage.setItem("winner", coms_participant[randomNumber(coms_participant.length)]);
				resolve();
			}
			else if($("#vote_box").is(":checked")) // Only vote
			{
				for (i = 0; i < vote_participant.length; i++)
				{
					$("#tab").append("<tr><td>"+(i+1)+"</td><td>"+vote_participant[i]+"</td></tr>");
				}
				sessionStorage.setItem("nb_valid", vote_participant.length);
				sessionStorage.setItem("winner", vote_participant[randomNumber(vote_participant.length)]);
				resolve();
			}
			else
			{
				reject("Err random draw");
			}
		}
	})
}

function getResult()
{
  	//console.log("getResult");

  console.log(sessionStorage.winner);
	if(sessionStorage.winner != "undefined")
	{
		win_list.push(sessionStorage.winner); // Winner list
		sessionStorage.setItem("num_of_draws", number_of_draws++); // Number of draw 
		$("#winner").html("<h1><img src='images/hive.png'> <a href='"+sessionStorage.link_site+"/@"+sessionStorage.winner+"' target='_blank'>@"+sessionStorage.winner+
				"</a></h1><b class='w3-right'><i class='fa fa-certificate'></i> Certified random draw n°"+sessionStorage.num_of_draws+"</b>");
	}
	else
	{
		$("#winner").html("<h1><img src='images/hive.png'> Noboddy is eligible</h1>");
	}

	$('#coms_nb').html(sessionStorage.coms_nb);
	$('#vote_nb').html(sessionStorage.vote_nb);
	$('#part_nb').html(sessionStorage.nb_valid);

	if($("#coms_box").is(":checked")) // If opt coms
	{
		if($("#vote_box").is(":checked")) // If otp coms & vote
		{
			if (localStorage.coms_text != "")
			{
				$('#cond_opt').html("<b class='w3-text-red'>"+$('#vote_tit').html()+"</b> <i>("+localStorage.vote_min+"%)</i> "+$('input[name=choi_field]:checked').val()+" <b class='w3-text-red'>"+$('#coms_tit').html()+"</b> <i>(\""+localStorage.coms_text+"\")</i>");
			}
			else
			{
				$('#cond_opt').html("<b class='w3-text-red'>"+$('#vote_tit').html()+"</b> <i>("+localStorage.vote_min+"%)</i> "+$('input[name=choi_field]:checked').val()+" <b class='w3-text-red'>"+$('#coms_tit').html()+"</b>");
			}
		}
		else // If coms only
		{
			if (localStorage.coms_text != "")
				$('#cond_opt').html("<b class='w3-text-red'>"+$('#coms_tit').html()+"</b> <i>(\""+localStorage.coms_text+"\")</i>");
			else
				$('#cond_opt').html("<b class='w3-text-red'>"+$('#coms_tit').html()+"</b>");
		}
	}
	else // If vote only
	{
		if (localStorage.vote_min != "")
			$('#cond_opt').html("<b class='w3-text-red'>"+$('#vote_tit').html()+"</b> <i>("+localStorage.vote_min+"%)</i>");
		else
			$('#cond_opt').html("<b class='w3-text-red'>"+$('#vote_tit').html()+"</b>");
	}

	if(sessionStorage.num_of_draws >= 2)
		$('#btn_win_list').removeClass("w3-hide");

	$("#wait").addClass("w3-hide");
	$('#result').removeClass("w3-hide");
}

function showErr(err)
{
		$('#err_body').html(err);
		$('#err_div').removeClass("w3-hide");
		$("#wait").addClass("w3-hide");
}

// END FUNCTION
const start = async function(link) 
{
	try 
	{
	  await getAuthorPermlink(link);
	  await getInfoBase();
		await getInfoVote();
		if($("#repl_box").is(":checked") && $("#coms_box").is(":checked") && sessionStorage.coms_nb >= 1) // If coms reply is checked
		{
			await fetchReplies(sessionStorage.author, sessionStorage.permlink);
		}
		else
		{
			await getInfoComs();
			await getRandomDraw();
			getResult();
		}
	}
	catch (error)
	{
		showErr(error);
	}
}

// EVENT
$("#coms_box").change(function()
{
	if($("#coms_box").is(":checked"))
	{
		$("#coms_field").prop('disabled', false);
		if($("#vote_box").is(":checked")) // Vote & Coms
		{
			$("#choi_view").removeClass("w3-hide");
		}
	}
	else
	{
		$("#choi_view").addClass("w3-hide");
		$("#coms_field").prop('disabled', true);
		$("#coms_field").prop('value', "");
		if(!$("#vote_box").is(":checked")) // Vote only
		{
			$("#vote_box").prop('checked', true);
			$("#UpVoteSlider").prop('disabled', false);
			$("#UpVoteSlider").fadeTo("slow", 1 );
		}
	}
}).change();

$("#vote_box").change(function()
{
	if($("#vote_box").is(":checked"))
	{
		$("#UpVoteSlider").prop('disabled', false);
		$("#UpVoteSlider").fadeTo("slow", 1 );
		if($("#coms_box").is(":checked")) // Vote & Coms
		{
			$("#choi_view").removeClass("w3-hide");
		}
	}
	else
	{
		$("#UpVoteSlider").prop('disabled', true);
		$("#UpVoteSlider").fadeTo("slow", 0.33 );
		$("#choi_view").addClass("w3-hide");
		if(!$("#coms_box").is(":checked")) // Vote only
		{
			$("#coms_box").prop('checked', true);
			$("#coms_field").prop('disabled', false);
		}
	}
}).change();

$("#btn_win_list").click(function()
{
	$("#win_tab").html(""); // RESET
	for (i = 0; i < win_list.length; i++)
	{
		$("#win_tab").append("<tr><td>"+(i+1)+"</td><td>"+win_list[i]+"</td></tr>");
	}
	$("#win_view").show();
});

$('#link_form').submit(function(event)
{
	event.preventDefault();
	//console.log($("#wait"));
	$("#wait").removeClass("w3-hide");

	// SAVE SET
		if($("#repl_box").is(":checked")) localStorage.setItem("repl_box", true);
		else localStorage.setItem("repl_box", false);
		if($("#coms_box").is(":checked")) localStorage.setItem("coms_box", true);
		else localStorage.setItem("coms_box", false);
		if($("#vote_box").is(":checked")) localStorage.setItem("vote_box", true);
		else localStorage.setItem("vote_box", false);
		if($("#bots_box").is(":checked")) localStorage.setItem("bots_box", true);
		else localStorage.setItem("bots_box", false);
		if($("#dble_box").is(":checked")) localStorage.setItem("dble_box", true);
		else localStorage.setItem("dble_box", false);

		localStorage.setItem("choi_box", $('input[name=choi_field]:checked').val());
		localStorage.setItem("vote_min", $('#UpVoteValue')[0].innerText);
		localStorage.setItem("coms_text", $('#coms_field')[0].value);
	// END SAVE SET	

	// RESET
		$("#tab").html("");
		$("#winner").html(reset);
		$('#participants').addClass("w3-hide");
		$('#result').addClass("w3-hide");
		vote_participant = [];
		coms_participant = [];
		participants = [];
	// END RESET

	start($('#link_field')[0].value);
});

window.onunload = function()
{
  sessionStorage.clear();
};
// END EVENT
