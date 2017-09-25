$(function() {
  var allEles = null;
  var allNodes = null;
  var aniDur = 500;
  var cy = null;
  var easing = 'linear';
  var fadeDelay = 250;
  var hideDelay = 125;
  var lastHighlighted = null;
  var lastUnhighlighted = null;
  var layoutPadding = 50;

  var infoTemplate = Handlebars.compile([
    '<p class="ac-name">{{name}}</p>',
    '{{#if indegree}}<p class="ac-node-type">Degree: {{indegree}}</p>{{/if}}',
    '{{#if pagerank}}<p class="ac-node-type">PageRank: {{pagerank}}</p>{{/if}}',
    '{{#if betweenness}}<p class="ac-node-type">Betweenness: {{betweenness}}</p>{{/if}}',
    '<p class="ac-more"><a target="_blank" href="{{wiki}}">Wiki <i class="fa fa-external-link"></i></a></p>'
  ].join(''));

  // Get style via ajax, though this will remain static.
  var styleP = $.ajax({
    url: './output/got.style.json',
    type: 'GET',
    dataType: 'text'
  });

  // Get exported json from cytoscape desktop via ajax.
  var graphP = $.ajax({
    url: './output/storm_of_swords.json',
    type: 'GET',
    dataType: 'json'
  });

  // when both graph export json and style loaded, init cy
  Promise.all([graphP, styleP]).then(initCy);

  function getFadePromise(ele, opacity) {
    return ele.animation({
      style: {'opacity': opacity},
      duration: aniDur
    }).play().promise();
  };

  var restoreElesPositions = function(nhood) {
    return Promise.all(nhood.map(function(ele) {
      var p = ele.data('orgPos');

      return ele.animation({
        position: {x: p.x, y: p.y},
        duration: aniDur,
        easing: easing
      }).play().promise();
    }));
  };

  function highlight(node) {
    var oldNhood = lastHighlighted;
    var nhood = lastHighlighted = node.closedNeighborhood();
    var others = lastUnhighlighted = cy.elements().not(nhood);

    var reset = function() {
      cy.batch(function() {
        others.addClass('hidden');
        nhood.removeClass('hidden');

        allEles.removeClass('faded highlighted');

        nhood.addClass('highlighted');

        others.nodes().forEach(function(n) {
          var p = n.data('orgPos');
          n.position({x: p.x, y: p.y});
        });
      });

      return Promise
        .resolve()
        .then(function() { return isDirty() ? fit() : Promise.resolve(); })
        .then(function() { return Promise.delay(aniDur); });
    };

    var runLayout = function() {
      var p = node.data('orgPos');
      var layout = nhood
          .filter(':visible')
          .makeLayout({
            name: 'concentric',
            fit: false,
            animate: true,
            animationDuration: aniDur,
            animationEasing: easing,
            boundingBox: {
              x1: p.x - 1,
              x2: p.x + 1,
              y1: p.y - 1,
              y2: p.y + 1
            },
            avoidOverlap: true,
            concentric: function(ele) { return ele.same(node) ? 2 : 1; },
            levelWidth: function() { return 1; },
            padding: layoutPadding
          });

      var promise = cy.promiseOn('layoutstop');
      layout.run();
      return promise;
    };

    var fit = function() {
      return cy.animation({
        fit: {
          padding: layoutPadding
        },
        easing: easing,
        duration: aniDur
      }).play().promise();
    };

    var showOthersFaded = function() {
      return Promise
        .delay(fadeDelay)
        .then(function() {
          cy.batch(function() {
            others
              .removeClass('hidden')
              .addClass('faded');
          });
        });
    };

    return Promise.resolve()
      .then(reset)
      .then(runLayout)
      .then(fit)
      .then(showOthersFaded);
  }

  function isDirty() {
    return lastHighlighted != null;
  }

  function clear(opts) {
    if (!isDirty()) { return Promise.resolve(); }

    opts = $.extend({}, opts);

    cy.stop();
    allNodes.stop();

    var nhood = lastHighlighted;
    var others = lastUnhighlighted;

    lastHighlighted = lastUnhighlighted = null;

    var hideOthers = function() {
      return Promise
        .delay(hideDelay)
        .then(function() {
          others.addClass('hidden');
          return Promise.delay(hideDelay);
      });
    };

    var showOthers = function() {
      cy.batch(function() {
        allEles
          .removeClass('hidden')
          .removeClass('faded');
      });

      return Promise.delay(aniDur);
    };

    var restorePositions = function() {
      cy.batch(function() {
        others.nodes().forEach(function(n) {
          var p = n.data('orgPos');
          n.position({x: p.x, y: p.y});
        });
      });

      return restoreElesPositions(nhood.nodes());
    };

    var resetHighlight = function() {
      nhood.removeClass('highlighted');
    };

    return Promise.resolve()
      .then(resetHighlight)
      .then(hideOthers)
      .then(restorePositions)
      .then(showOthers)
    ;
  }

  function showNodeInfo(node) {
    $('#info').html(infoTemplate(node.data())).show();
  }

  function hideNodeInfo() {
    $('#info').hide();
  }

  function initCy(then) {
    var loading = document.getElementById('loading');
    var expJson = then[0];
    var styleJson = JSON.parse(then[1]).style;
    var elements = expJson.elements;

    elements.nodes.forEach(function(n) { n.data.orgPos = {x: n.position.x, y: n.position.y}; });

    loading.classList.add('loaded');

    cy = window.cy = cytoscape({
      container: document.getElementById('cy'),
      layout: {name: 'preset', padding: layoutPadding},
      style: styleJson,
      elements: elements,
      motionBlur: true,
      selectionType: 'single',
      boxSelectionEnabled: false,
      autoungrabify: true
    });

    allNodes = cy.nodes();
    allEles = cy.elements();

    cy.on('free', 'node', function(e) {
      var n = e.cyTarget;
      var p = n.position();
      n.data('orgPos', {x: p.x, y: p.y});
    });

    cy.on('tap', function() {
      $('#search').blur();
    });

    cy.on('select unselect',
          'node',
          _.debounce(function(e) {
            var node = cy.$('node:selected');

            if (node.nonempty()) {
              showNodeInfo(node);

              Promise
                .resolve()
                .then(function() { return highlight(node); });
            } else {
              hideNodeInfo();
              clear();
            }
          }, 100)
         );
  }

  var lastSearch = '';

  $('#search')
    .typeahead({
      minLength: 2,
      highlight: true,
    },
    {
      name: 'search-dataset',
      source: function(query, cb) {
        function matches(str, q) {
          str = (str || '').toLowerCase();
          q = (q || '').toLowerCase();

          return str.match(q);
        }

        var fields = ['name'];

        function anyFieldMatches(n) {
          for (var i = 0; i < fields.length; i++) {
            var f = fields[i];

            if (matches(n.data(f), query)) { return true; }
          }

          return false;
        }

        function getData(n) { return n.data(); }

        function sortByName(n1, n2) {
          if (n1.data('name') < n2.data('name')) {
            return -1;
          } else if (n1.data('name') > n2.data('name')) {
            return 1;
          } else {
            return 0;
          }
        }

        var res = allNodes
            .stdFilter(anyFieldMatches)
            .sort(sortByName)
            .map(getData);

        cb(res);
      },
      templates: {
        suggestion: infoTemplate
      }
    })
    .on('typeahead:selected',
        function(e, entry, dataset) {
          var n = cy.getElementById(entry.id);

          cy.batch(function() {
            allNodes.unselect();
            n.select();
          });

          showNodeInfo(n);
        })
    .on('keydown keypress keyup change',
        _.debounce(function(e) {
          var thisSearch = $('#search').val();

          if (thisSearch !== lastSearch) {
            $('.tt-dropdown-menu').scrollTop(0);
            lastSearch = thisSearch;
          }
        }, 50));

  $('#reset')
    .on('click', function() {
      if (isDirty()) {
        clear();
      } else {
        allNodes.unselect();
        hideNodeInfo();

        cy.stop();

        cy.animation({
          fit: {
            eles: cy.elements(),
            padding: layoutPadding
          },
          duration: aniDur,
          easing: easing
        }).play();
      }
    });
});
