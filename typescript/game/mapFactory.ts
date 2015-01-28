/// <reference path="maps/Map1.ts" />
/// <reference path="maps/SmallMap.ts" />
/// <reference path="maps/StripesMap.ts" />
/// <reference path="maps/TinyMap.ts" />
/// <reference path="maps/IMap.ts" />

class MapFactory {
	private static dict = {
		"0": new TinyMap(),
		"1": new Map1(),
		"2": new SmallMap(),
		"3": new StripesMap()
	}

	public static GetMap(id: string): IMap {
		if (id === null || id === undefined) {
			//todo: error!!
			return undefined;
		}
		
		return MapFactory.dict[id];
	}
}