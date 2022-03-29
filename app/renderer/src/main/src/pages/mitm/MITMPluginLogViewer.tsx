import React from "react";
import {AutoCard} from "../../components/AutoCard";
import {Divider, Space, Tag} from "antd";
import {formatDate} from "../../utils/timeUtil";
import {StatusCardViewer} from "./MITMYakScriptLoader";
import {YakitLogViewers} from "../invoker/YakitLogFormatter";
import {ExecResultLog} from "../invoker/batch/ExecMessageViewer";
import moment from "moment";
import {StatusCardProps} from "../yakitStore/viewers/base";

export interface MITMPluginLogViewerProp {
    messages: ExecResultLog[]
    status: StatusCardProps[]
}


export const MITMPluginLogViewer: React.FC<MITMPluginLogViewerProp> = React.memo((props) => {
    const {status} = props;
    const currentTimestamp: number = (props?.messages || []).length > 0 ? props.messages[0].timestamp : moment().unix()

    return <AutoCard
        title={<Space>
            <Tag color={"geekblue"}>{formatDate(currentTimestamp)}</Tag>
        </Space>}
        size={"small"}
        bodyStyle={{overflowY: "auto"}}
    >
        <StatusCardViewer status={status}/>
        <Divider style={{marginTop: 8}}/>
        <YakitLogViewers data={props.messages} onlyTime={true}/>
    </AutoCard>
});