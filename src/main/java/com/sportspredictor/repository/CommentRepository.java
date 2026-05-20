package com.sportspredictor.repository;

import com.sportspredictor.model.Comment;
import com.sportspredictor.model.Match;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByMatchOrderByCreatedAtDesc(Match match);
}
