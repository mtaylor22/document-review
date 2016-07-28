

var app = angular.module('doc-review', []);
app.controller('doc-controller', ['$scope', '$http', function ($scope, $http) {
  $scope.refreshData = function() {
	$http.get("/docs", {}).then(function (response) {
		var jres = response;
		$scope.docs = jres.data.docs;	
		a = jres
	})
  }
}]);