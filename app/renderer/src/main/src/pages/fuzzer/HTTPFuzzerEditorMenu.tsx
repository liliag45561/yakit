import React, {useEffect, useMemo, useRef, useState} from "react"
import {Avatar, Space, Timeline} from "antd"
import {FormOutlined, PlusOutlined} from "@ant-design/icons"
import styles from "./HTTPFuzzerEditorMenu.module.scss"
import {failed, success, warn, info} from "@/utils/notification"
import classNames from "classnames"
import {YakitButton} from "@/components/yakitUI/YakitButton/YakitButton"
import {
    ChevronDownIcon,
    ChevronUpIcon,
    DocumentDuplicateSvgIcon,
    DragSortIcon,
    IconSolidCodeIcon,
    IconSolidSparklesIcon,
    IconSolidTagIcon,
    SolidTerminalIcon,
    TerminalIcon,
    TrashIcon
} from "@/assets/newIcon"
import {YakitSegmented} from "@/components/yakitUI/YakitSegmented/YakitSegmented"
import {AutoDecodeResult} from "@/utils/encodec"
import {callCopyToClipboard} from "@/utils/basic"
import {YakitInput} from "@/components/yakitUI/YakitInput/YakitInput"
import {QueryFuzzerLabelResponseProps} from "./StringFuzzer"
import {setRemoteValue} from "@/utils/kv"
import {CountDirectionProps} from "@/components/NewEditorSelectRange"
const {ipcRenderer} = window.require("electron")

const directionStyle = (direction) => {
    let obj: any = {}
    if (direction) {
        if (direction.x === "right") {
            obj.right = 0
        }
        if (direction.y === "bottom") {
            obj.bottom = "32px"
        }
    }
    return obj
}

export interface HTTPFuzzerClickEditorMenuProps {
    close: () => void
    direction?: CountDirectionProps
    insert: (v: QueryFuzzerLabelResponseProps) => void
    addLabel: () => void
}

export interface LabelDataProps {
    DefaultDescription: string
    Description?: string
    Label?: string
}

export const defaultLabel: LabelDataProps[] = [
    {
        DefaultDescription: "4位验证码",
        Description: "4位验证码",
        Label: "{{int(0000-9999|4)}}"
    },
    {
        DefaultDescription: "6位验证码",
        Description: "6位验证码",
        Label: "{{int(000000-999999|6)}}"
    },
    {
        DefaultDescription: "用户名爆破",
        Description: "用户名爆破",
        Label: "{{x(user_top10)}}"
    },
    {
        DefaultDescription: "密码爆破",
        Description: "密码爆破",
        Label: "{{x(pass_top25)}}"
    },
    {
        DefaultDescription: "插入本地文件",
        Description: "插入本地文件"
    },
    {
        DefaultDescription: "重复发包",
        Description: "重复发包",
        Label: "{{repeat(3)}}"
    },
    {
        DefaultDescription: "随机生成字符串数",
        Description: "随机生成字符串数",
        Label: "{{randstr(1,1010)}}"
    },
    {
        DefaultDescription: "整数标签",
        Description: "整数标签",
        Label: "{{int(0,100)}}"
    },
    {
        DefaultDescription: "时间戳",
        Description: "时间戳",
        Label: "{{timestamp(seconds)}}"
    },
    {
        DefaultDescription: "空字符",
        Description: "空字符",
        Label: "{{null(2)}}"
    }
]

export const FUZZER_LABEL_LIST_NUMBER = "fuzzer-label-list-number"

export const HTTPFuzzerClickEditorMenu: React.FC<HTTPFuzzerClickEditorMenuProps> = (props) => {
    const {close, direction, insert, addLabel} = props
    const [labelData, setLabelData] = useState<QueryFuzzerLabelResponseProps[]>([])
    const [selectLabel, setSelectLabel] = useState<string>()
    const [inputValue, setInputValue] = useState<string>()
    const [isEnterSimple, setEnterSimple] = useState<boolean>(false)
    const getData = () => {
        ipcRenderer.invoke("QueryFuzzerLabel", {}).then((data: {Data: QueryFuzzerLabelResponseProps[]}) => {
            const {Data} = data
            if (Array.isArray(Data) && Data.length > 0) {
                setLabelData(Data)
                setSelectLabel(undefined)
            }
        })
    }
    useEffect(() => {
        getData()
    }, [])
    const insertLabel = (item: QueryFuzzerLabelResponseProps) => {
        if (isSelect(item)) {
            // 复原修改项
            setSelectLabel(undefined)
        } else {
            insert(item)
        }
    }
    const delLabel = (Hash: string) => {
        ipcRenderer.invoke("DeleteFuzzerLabel", {Hash}).then(() => {
            getData()
        })
    }
    const reset = () => {
        // 删除标签后重新添加默认标签
        ipcRenderer.invoke("DeleteFuzzerLabel", {}).then(() => {
            setRemoteValue(FUZZER_LABEL_LIST_NUMBER, JSON.stringify({number: defaultLabel.length}))
            ipcRenderer
                .invoke("SaveFuzzerLabel", {
                    Data: defaultLabel
                })
                .then(() => {
                    getData()
                })
        })
    }
    const isSelect = (item: QueryFuzzerLabelResponseProps) => selectLabel === item.Hash
    
    return (
        <div className={styles["http-fuzzer-click-editor"]}>
            <div className={styles["http-fuzzer-click-editor-simple"]}>
                <div
                    className={styles["show-box"]}
                    onMouseEnter={() => {
                        setEnterSimple(true)
                    }}
                >
                    <IconSolidTagIcon className={styles["tag"]} />
                    <div className={styles["content"]}>插入标签</div>
                    {isEnterSimple ? (
                        <ChevronUpIcon className={styles["up"]} />
                    ) : (
                        <ChevronDownIcon className={styles["down"]} />
                    )}
                </div>
            </div>
            {isEnterSimple && (
                <div
                    className={styles["http-fuzzer-click-editor-menu"]}
                    onMouseLeave={() => setEnterSimple(false)}
                    style={{...directionStyle(direction)}}
                >
                    <div className={styles["menu-header"]}>
                        <div className={styles["menu-header-left"]}>
                            常用标签
                            <span className={styles["menu-header-left-count"]}>{labelData.length || ""}</span>
                        </div>
                        <div className={styles["menu-header-opt"]}>
                            <YakitButton type='text' onClick={() => addLabel()}>
                                添加 <PlusOutlined className={styles["add-icon"]} />
                            </YakitButton>
                            <div className={styles["line"]}></div>
                            <YakitButton type='text' style={{color: "#85899E"}} onClick={() => reset()}>
                                复原
                            </YakitButton>
                        </div>
                    </div>
                    <div className={styles["menu-list"]}>
                        {labelData.map((item, index) => (
                            <div
                                key={`${item?.Label}-${index}`}
                                className={styles["menu-list-item"]}
                                onClick={() => insertLabel(item)}
                            >
                                <div className={styles["menu-list-item-info"]}>
                                    <DragSortIcon className={styles["drag-sort-icon"]} />
                                    {isSelect(item) ? (
                                        <YakitInput
                                            defaultValue={item.Description}
                                            className={styles["input"]}
                                            size='small'
                                            onChange={(e) => {
                                                setInputValue(e.target.value)
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                            }}
                                        />
                                    ) : (
                                        <>
                                            <div className={styles["title"]}>{item.Description}</div>
                                            <div
                                                className={classNames(styles["sub-title"], {
                                                    [styles["sub-title-left"]]: !!item.Description
                                                })}
                                            >
                                                {item.Label}
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className={styles["menu-list-item-opt"]}>
                                    {isSelect(item) ? (
                                        <YakitButton
                                            type='text'
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                if (inputValue) {
                                                    ipcRenderer
                                                        .invoke("SaveFuzzerLabel", {
                                                            Data: [{...item, Description: inputValue}]
                                                        })
                                                        .then(() => {
                                                            getData()
                                                        })
                                                }
                                            }}
                                        >
                                            确认
                                        </YakitButton>
                                    ) : (
                                        <>
                                            <FormOutlined
                                                className={styles["form-outlined"]}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setSelectLabel(item.Hash)
                                                }}
                                            />
                                            <TrashIcon
                                                className={styles["trash-icon"]}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    delLabel(item.Hash)
                                                }}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export interface EncodeComponentProps {
    insert: (v: any) => void
}
interface decodeDataProps {
    color: string
    avatar: string
    title: string
    sub_title: string
    encode: (v: string) => string
}
export const EncodeComponent: React.FC<EncodeComponentProps> = (props) => {
    const {insert} = props
    const decodeData = useRef<decodeDataProps[]>([
        {
            color: "rgba(136, 99, 247, 0.6)",
            avatar: "m",
            title: "Md5 编码",
            sub_title: "md5",
            encode: (v: string) => `{{md5(${v})}}`
        },
        {
            color: "rgba(74, 148, 248, 0.6)",
            avatar: "b",
            title: "Base64 编码",
            sub_title: "base64enc",
            encode: (v: string) => `{{base64enc(${v})}}`
        },
        {
            color: "rgba(74, 148, 248, 0.6)",
            avatar: "b",
            title: "先 Base64 后 URL 编码",
            sub_title: "{{urlenc(base64enc(xxx))}}",
            encode: (v: string) => `{{urlenc(base64enc(${v}))}}`
        },
        {
            color: "rgba(86, 201, 145, 0.6)",
            avatar: "h",
            title: "HEX 编码（十六进制编码）",
            sub_title: "hexenc",
            encode: (v: string) => `{{hexenc(${v})}}`
        },
        {
            color: "rgba(244, 115, 107, 0.6)",
            avatar: "h",
            title: "HTML 编码",
            sub_title: "htmlenc",
            encode: (v: string) => `{{htmlenc(${v})}}`
        },
        {
            color: "rgba(255, 182, 96, 0.6)",
            avatar: "u",
            title: "URL 编码",
            sub_title: "urlenc",
            encode: (v: string) => `{{urlenc(${v})}}`
        },
        {
            color: "rgba(218, 95, 221, 0.6)",
            avatar: "u",
            title: "URL 编码（只编码特殊字符）",
            sub_title: "urlescape",
            encode: (v: string) => `{{urlescape(${v})}}`
        }
    ])
    return (
        <div className={styles["encode-box"]}>
            {decodeData.current.map((item) => {
                return (
                    <div key={item.title} className={styles["encode-item"]} onClick={() => insert(item.encode)}>
                        <Avatar size={16} style={{color: "rgba(49, 52, 63, 1)", backgroundColor: item.color}}>
                            {item.avatar}
                        </Avatar>
                        <div className={styles["title"]}>{item.title}</div>
                        <div className={styles["sub-title"]}>{item.sub_title}</div>
                    </div>
                )
            })}
        </div>
    )
}

interface DecodeCopyReplaceProps {
    item: AutoDecodeResult
    // 是否显示边框
    isShowBorder: boolean
    index?: number
    // 是否仅可读
    isReadOnly?: boolean
    replace?: (v: string) => void
}

export const DecodeCopyReplace: React.FC<DecodeCopyReplaceProps> = (props) => {
    const {item, index, isShowBorder, isReadOnly, replace} = props
    const itemStr: string = new Buffer(item.Result).toString("utf8")
    return (
        <div className={styles["decode-copy-replace"]}>
            <div
                className={classNames(styles["header"], {
                    [styles["header-solid"]]: isShowBorder
                })}
            >
                <div className={styles["header-info"]}>
                    {!isShowBorder && <div className={styles["title"]}>Step [{index}]</div>}
                    <div className={styles["sub-title"]}>{item.TypeVerbose}</div>
                </div>
                <div className={styles["header-opt"]}>
                    <div
                        className={styles["yakit-copy"]}
                        onClick={() => {
                            callCopyToClipboard(itemStr)
                        }}
                    >
                        <DocumentDuplicateSvgIcon className={styles["document-duplicate-svg-icon"]} />
                    </div>
                    {!isReadOnly && (
                        <YakitButton
                            size='small'
                            onClick={() => {
                                replace && replace(itemStr)
                            }}
                        >
                            替换
                        </YakitButton>
                    )}
                </div>
            </div>
            <div
                className={classNames(styles["content"], {
                    [styles["content-solid"]]: isShowBorder
                })}
            >
                {itemStr}
            </div>
        </div>
    )
}

export interface DecodeComponentProps {
    isReadOnly?: boolean
    rangeValue: string
    replace?: (v: string) => void
}

export const DecodeComponent: React.FC<DecodeComponentProps> = (props) => {
    const {isReadOnly, rangeValue, replace} = props
    const [status, setStatus] = useState<"none" | "only" | "many">()
    const [result, setResult] = useState<AutoDecodeResult[]>([])
    useEffect(() => {
        try {
            if (!rangeValue) {
                setStatus("none")
                return
            }
            ipcRenderer.invoke("AutoDecode", {Data: rangeValue}).then((e: {Results: AutoDecodeResult[]}) => {
                // console.log("Results", e.Results)
                const {Results} = e
                let successArr: AutoDecodeResult[] = []
                let failArr: AutoDecodeResult[] = []
                Results.map((item) => {
                    if (item.Type === "No") {
                        failArr.push(item)
                    } else {
                        successArr.push(item)
                    }
                })
                setResult(successArr)
                if (successArr.length === 0) {
                    setStatus("none")
                } else if (successArr.length === 1) {
                    setStatus("only")
                } else {
                    setStatus("many")
                }
            })
        } catch (e) {
            failed("editor exec auto-decode failed")
        }
    }, [])

    return (
        <div className={styles["decode-box"]}>
            {isReadOnly && <div className={styles["title"]}>智能解码</div>}
            {status === "only" && (
                <div className={styles["only-one"]}>
                    <DecodeCopyReplace isReadOnly={isReadOnly} item={result[0]} isShowBorder={true} replace={replace} />
                </div>
            )}
            {status === "many" && (
                <div className={styles["timeline-box"]}>
                    <Timeline>
                        {result.map((item, index) => {
                            return (
                                <Timeline.Item
                                    className={styles["timeline-item"]}
                                    dot={<SolidTerminalIcon className={styles["solid-terminal-icon"]} />}
                                >
                                    <DecodeCopyReplace
                                        item={item}
                                        index={index + 1}
                                        isShowBorder={false}
                                        replace={replace}
                                        isReadOnly={isReadOnly}
                                    />
                                </Timeline.Item>
                            )
                        })}
                    </Timeline>
                </div>
            )}
            {status === "none" && <div className={styles["none-decode"]}>无解码信息</div>}
        </div>
    )
}

export interface HTTPFuzzerRangeEditorMenuProps {
    direction?: CountDirectionProps
    insert: (v: any) => void
    rangeValue: string
    replace?: (v: string) => void
}
export const HTTPFuzzerRangeEditorMenu: React.FC<HTTPFuzzerRangeEditorMenuProps> = (props) => {
    const {direction, insert, rangeValue, replace} = props
    const [segmentedType, setSegmentedType] = useState<"decode" | "encode">()
    return (
        <div className={styles["http-fuzzer-range-editor"]}>
            <div
                className={styles["http-fuzzer-range-editor-simple"]}
            >
                <div className={styles["show-box"]}>
                    <div
                        className={styles["encode-box"]}
                        onMouseEnter={() => {
                            setSegmentedType("encode")
                        }}
                    >
                        <IconSolidCodeIcon className={styles["tag"]} />
                        <div className={styles["content"]}>编码</div>
                        {segmentedType === "encode" ? (
                            <ChevronUpIcon className={styles["up"]} />
                        ) : (
                            <ChevronDownIcon className={styles["down"]} />
                        )}
                    </div>
                    <div className={styles["line"]}></div>
                    <div
                        className={styles["decode-box"]}
                        onClick={() => {
                            setSegmentedType("decode")
                        }}
                    >
                        <IconSolidSparklesIcon className={styles[""]} />
                        <div className={styles["content"]}>解码</div>
                    </div>
                </div>
            </div>
            {segmentedType && (
                <div
                    style={{...directionStyle(direction)}}
                    className={styles["http-fuzzer-range-editor-menu"]}
                    onMouseLeave={() => setSegmentedType(undefined)}
                >
                    <div className={styles["menu-content"]}>
                        {segmentedType === "encode" ? (
                            <EncodeComponent insert={insert} />
                        ) : (
                            <DecodeComponent rangeValue={rangeValue} replace={replace} />
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

interface HTTPFuzzerRangeReadOnlyEditorMenuProps {
    direction?: CountDirectionProps
    rangeValue: string
}

export const HTTPFuzzerRangeReadOnlyEditorMenu: React.FC<HTTPFuzzerRangeReadOnlyEditorMenuProps> = (props) => {
    const {direction, rangeValue} = props
    const [segmentedType, setSegmentedType] = useState<"decode">()
    return (
        <div className={styles["http-fuzzer-read-editor"]}>
            <div className={styles["http-fuzzer-read-editor-simple"]}>
                <div className={styles["show-box"]}>
                    <div className={styles["decode-box"]} onClick={() => setSegmentedType("decode")}>
                        <IconSolidSparklesIcon className={styles[""]} />
                        <div className={styles["content"]}>解码</div>
                    </div>
                </div>
            </div>
            {segmentedType && (
                <div
                    style={directionStyle(direction)}
                    className={styles["http-fuzzer-range-read-only-editor-menu"]}
                    onMouseLeave={() => setSegmentedType(undefined)}
                >
                    <DecodeComponent rangeValue={rangeValue} isReadOnly={true} />
                </div>
            )}
        </div>
    )
}