package com.sportspredictor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public class PredictionRequest {

    @NotNull
    private Long matchId;

    @NotBlank
    @Pattern(regexp = "CONTESTANT1|CONTESTANT2")
    private String predictedWinner;

    public Long getMatchId() { return matchId; }
    public void setMatchId(Long matchId) { this.matchId = matchId; }
    public String getPredictedWinner() { return predictedWinner; }
    public void setPredictedWinner(String pw) { this.predictedWinner = pw; }
}
