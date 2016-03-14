
export enum BuildStatus {
    Queued,
    Running,
    Aborted,
    Failed,
    Success
};

export function fromJson(obj: any) : BuildResult {
    var result = new BuildResult();
    result.buildHost = obj.builtOn;
    result.duration = obj.duration;
    result.name = obj.fullDisplayName;
    result.number = obj.number
    result.result = obj.result;
    result.timestamp = new Date(obj.timestamp);
    result.building = obj.building;
    return result;
}

export class BuildResult {
    duration: number;
    result: string;
    timestamp: Date;
    name: string;
    number: number;
    buildHost: string;
    url: string;
    building: boolean;
};