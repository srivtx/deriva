import type { GlueMessageProto } from './glue';
export declare const GLUE_VERSION = 1;
export declare const GLUE_MESSAGE_PROTOTYPES: {
    [name: string]: GlueMessageProto;
};
export interface GlueMsgError {
    _name: "erro_evt";
    message: string;
}
export interface GlueMsgLoadReq {
    _name: "load_req";
    model_paths: string[];
    n_ctx_auto: boolean;
    use_mmap: boolean;
    use_mlock: boolean;
    n_gpu_layers: number;
    seed: number;
    n_ctx: number;
    n_threads: number;
    embeddings?: boolean | undefined;
    offload_kqv?: boolean | undefined;
    n_batch?: number | undefined;
    n_seq_max?: number | undefined;
    pooling_type?: string | undefined;
    rope_scaling_type?: string | undefined;
    rope_freq_base?: number | undefined;
    rope_freq_scale?: number | undefined;
    yarn_ext_factor?: number | undefined;
    yarn_attn_factor?: number | undefined;
    yarn_beta_fast?: number | undefined;
    yarn_beta_slow?: number | undefined;
    yarn_orig_ctx?: number | undefined;
    cache_type_k?: string | undefined;
    cache_type_v?: string | undefined;
    flash_attn?: boolean | undefined;
    swa_full?: boolean | undefined;
}
export interface GlueMsgLoadRes {
    _name: "load_res";
    success: boolean;
    n_ctx: number;
    n_batch: number;
    n_ubatch: number;
    n_vocab: number;
    n_ctx_train: number;
    n_embd: number;
    n_layer: number;
    metadata_key: string[];
    metadata_val: string[];
    token_bos: number;
    token_eos: number;
    token_eot: number;
    list_tokens_eog: number[];
    add_bos_token: boolean;
    add_eos_token: boolean;
    has_encoder: boolean;
    token_decoder_start: number;
}
export interface GlueMsgSetOptionsReq {
    _name: "opti_req";
    embeddings: boolean;
}
export interface GlueMsgSetOptionsRes {
    _name: "opti_res";
    success: boolean;
}
export interface GlueMsgSamplingInitReq {
    _name: "sint_req";
    mirostat?: number | undefined;
    mirostat_tau?: number | undefined;
    mirostat_eta?: number | undefined;
    temp?: number | undefined;
    top_p?: number | undefined;
    top_k?: number | undefined;
    penalty_last_n?: number | undefined;
    penalty_repeat?: number | undefined;
    penalty_freq?: number | undefined;
    penalty_present?: number | undefined;
    dynatemp_range?: number | undefined;
    dynatemp_exponent?: number | undefined;
    samplers_sequence?: string[] | undefined;
    grammar?: string | undefined;
    n_prev?: number | undefined;
    n_probs?: number | undefined;
    min_p?: number | undefined;
    typical_p?: number | undefined;
    typ_p?: number | undefined;
    logit_bias_toks?: number[] | undefined;
    logit_bias_vals?: number[] | undefined;
    tokens?: number[] | undefined;
}
export interface GlueMsgSamplingInitRes {
    _name: "sint_res";
    success: boolean;
}
export interface GlueMsgGetVocabReq {
    _name: "gvoc_req";
}
export interface GlueMsgGetVocabRes {
    _name: "gvoc_res";
    success: boolean;
    vocab: Uint8Array[];
}
export interface GlueMsgLookupTokenReq {
    _name: "lkup_req";
    piece: string;
}
export interface GlueMsgLookupTokenRes {
    _name: "lkup_res";
    success: boolean;
    token: number;
}
export interface GlueMsgTokenizeReq {
    _name: "tokn_req";
    text: string;
    special: boolean;
}
export interface GlueMsgTokenizeRes {
    _name: "tokn_res";
    success: boolean;
    tokens: number[];
}
export interface GlueMsgDetokenizeReq {
    _name: "dtkn_req";
    tokens: number[];
}
export interface GlueMsgDetokenizeRes {
    _name: "dtkn_res";
    success: boolean;
    buffer: Uint8Array;
}
export interface GlueMsgDecodeReq {
    _name: "deco_req";
    tokens: number[];
    skip_logits: boolean;
}
export interface GlueMsgDecodeRes {
    _name: "deco_res";
    success: boolean;
    message: string;
    n_past: number;
}
export interface GlueMsgEncodeReq {
    _name: "enco_req";
    tokens: number[];
}
export interface GlueMsgEncodeRes {
    _name: "enco_res";
    success: boolean;
    message: string;
    n_past: number;
}
export interface GlueMsgSamplingSampleReq {
    _name: "ssam_req";
}
export interface GlueMsgSamplingSampleRes {
    _name: "ssam_res";
    success: boolean;
    piece: Uint8Array;
    token: number;
}
export interface GlueMsgSamplingAcceptReq {
    _name: "sacc_req";
    tokens: number[];
}
export interface GlueMsgSamplingAcceptRes {
    _name: "sacc_res";
    success: boolean;
}
export interface GlueMsgGetLogitsReq {
    _name: "glog_req";
    top_k: number;
}
export interface GlueMsgGetLogitsRes {
    _name: "glog_res";
    success: boolean;
    tokens: number[];
    probs: number[];
}
export interface GlueMsgGetEmbeddingsReq {
    _name: "gemb_req";
    tokens: number[];
}
export interface GlueMsgGetEmbeddingsRes {
    _name: "gemb_res";
    success: boolean;
    message: string;
    embeddings: number[];
}
export interface GlueMsgGetKvRemoveReq {
    _name: "kvcr_req";
    n_keep: number;
    n_discard: number;
}
export interface GlueMsgGetKvRemoveRes {
    _name: "kvcr_res";
    n_past: number;
    success: boolean;
}
export interface GlueMsgGetKvClearReq {
    _name: "kvcc_req";
}
export interface GlueMsgGetKvClearRes {
    _name: "kvcc_res";
    n_past: number;
    success: boolean;
}
export interface GlueMsgSessionSaveReq {
    _name: "sesa_req";
    session_path: string;
}
export interface GlueMsgSessionSaveRes {
    _name: "sesa_res";
    success: boolean;
    tokens: number[];
}
export interface GlueMsgSessionLoadReq {
    _name: "sesl_req";
    session_path: string;
    tokens: number[];
}
export interface GlueMsgSessionLoadRes {
    _name: "sesl_res";
    success: boolean;
}
export interface GlueMsgStatusReq {
    _name: "stat_req";
}
export interface GlueMsgStatusRes {
    _name: "stat_res";
    success: boolean;
    tokens: number[];
}
export interface GlueMsgTestBenchmarkReq {
    _name: "tben_req";
    type: string;
    n_samples: number;
}
export interface GlueMsgTestBenchmarkRes {
    _name: "tben_res";
    success: boolean;
    message: string;
    t_ms: number;
}
export interface GlueMsgTestPerplexityReq {
    _name: "tper_req";
    tokens: number[];
}
export interface GlueMsgTestPerplexityRes {
    _name: "tper_res";
    success: boolean;
    message: string;
    ppl: number;
    nll: number;
    cross_entropy: number;
    n_tokens: number;
    t_ms: number;
}
export interface GlueMsgChatFormatReq {
    _name: "cfmt_req";
    tmpl?: string | undefined;
    add_ass?: boolean | undefined;
    roles: string[];
    contents: string[];
}
export interface GlueMsgChatFormatRes {
    _name: "cfmt_res";
    success: boolean;
    message: string;
    formatted_chat: string;
}
export type GlueMsg = GlueMsgError | GlueMsgLoadReq | GlueMsgLoadRes | GlueMsgSetOptionsReq | GlueMsgSetOptionsRes | GlueMsgSamplingInitReq | GlueMsgSamplingInitRes | GlueMsgGetVocabReq | GlueMsgGetVocabRes | GlueMsgLookupTokenReq | GlueMsgLookupTokenRes | GlueMsgTokenizeReq | GlueMsgTokenizeRes | GlueMsgDetokenizeReq | GlueMsgDetokenizeRes | GlueMsgDecodeReq | GlueMsgDecodeRes | GlueMsgEncodeReq | GlueMsgEncodeRes | GlueMsgSamplingSampleReq | GlueMsgSamplingSampleRes | GlueMsgSamplingAcceptReq | GlueMsgSamplingAcceptRes | GlueMsgGetLogitsReq | GlueMsgGetLogitsRes | GlueMsgGetEmbeddingsReq | GlueMsgGetEmbeddingsRes | GlueMsgGetKvRemoveReq | GlueMsgGetKvRemoveRes | GlueMsgGetKvClearReq | GlueMsgGetKvClearRes | GlueMsgSessionSaveReq | GlueMsgSessionSaveRes | GlueMsgSessionLoadReq | GlueMsgSessionLoadRes | GlueMsgStatusReq | GlueMsgStatusRes | GlueMsgTestBenchmarkReq | GlueMsgTestBenchmarkRes | GlueMsgTestPerplexityReq | GlueMsgTestPerplexityRes | GlueMsgChatFormatReq | GlueMsgChatFormatRes;
